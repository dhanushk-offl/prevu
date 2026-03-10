import { useCallback, useEffect, useMemo, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

import BatchInspector, { BatchInspectRow } from "../components/BatchInspector";
import ClipboardWatcherIndicator from "../components/ClipboardWatcherIndicator";
import ComparePanel, { CompareResult } from "../components/ComparePanel";
import ImageInspector, { ImageInfo } from "../components/ImageInspector";
import MetaTable from "../components/MetaTable";
import PreviewCard, { MetaData } from "../components/PreviewCard";
import UrlInput from "../components/UrlInput";
import ValidationPanel from "../components/ValidationPanel";

type InspectResult = {
  sourceUrl: string;
  resolvedUrl: string;
  meta: MetaData;
  validation: { passed: string[]; warnings: string[] };
  imageInfo?: ImageInfo;
};

type Settings = {
  autoSaveEnabled: boolean;
  historyEnabled: boolean;
  previewEnabled: boolean;
  watchMode: boolean;
  clipboardEnabled: boolean;
};

type HistoryItem = {
  id: string;
  mode: "single" | "batch" | "compare" | "monitor";
  title: string;
  detail: string;
  createdAt: string;
};

type SavedWorkspace = {
  id: string;
  name: string;
  createdAt: string;
  url: string;
  batchInput: string;
  stagingUrl: string;
  productionUrl: string;
};

type MonitorPage = {
  url: string;
  title?: string;
  imageUrl?: string;
  status: string;
  missingOgImage: boolean;
  missingDescription: boolean;
  invalidImageSize: boolean;
  warningCount: number;
  error?: string;
};

type MonitorResult = {
  siteUrl: string;
  discoverySource: string;
  pagesScanned: number;
  missingOgImage: number;
  missingDescription: number;
  invalidImageSize: number;
  pages: MonitorPage[];
};

type ViewKey = "inspector" | "monitor" | "batch" | "compare" | "history" | "settings";
type TabKey = "preview" | "meta" | "validation" | "image";

const views: { key: ViewKey; label: string }[] = [
  { key: "inspector", label: "Inspector" },
  { key: "monitor", label: "Site Monitor" },
  { key: "batch", label: "Batch" },
  { key: "compare", label: "Compare" },
  { key: "history", label: "History" },
  { key: "settings", label: "Settings" },
];

const tabs: { key: TabKey; label: string }[] = [
  { key: "preview", label: "Preview" },
  { key: "meta", label: "Meta Tags" },
  { key: "validation", label: "Validation" },
  { key: "image", label: "Image" },
];

const SETTINGS_KEY = "prevu.settings.v1";
const HISTORY_KEY = "prevu.history.v1";
const WORKSPACES_KEY = "prevu.workspaces.v1";

const defaultSettings: Settings = {
  autoSaveEnabled: true,
  historyEnabled: true,
  previewEnabled: true,
  watchMode: false,
  clipboardEnabled: true,
};

function safeParse<T>(value: string | null, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function readStorage<T>(key: string, fallback: T): T {
  try {
    return safeParse(window.localStorage.getItem(key), fallback);
  } catch {
    return fallback;
  }
}

function writeStorage(key: string, value: unknown) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore storage write errors
  }
}

function makeId() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function buildWorkspaceName(url: string) {
  const ts = new Date().toISOString().replace(/[:.]/g, "-");
  try {
    return `${new URL(url).hostname}-${ts}`;
  } catch {
    return `workspace-${ts}`;
  }
}

export default function Home() {
  const [activeView, setActiveView] = useState<ViewKey>("inspector");
  const [activeTab, setActiveTab] = useState<TabKey>("preview");

  const [url, setUrl] = useState("http://localhost:3000");
  const [result, setResult] = useState<InspectResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [batchInput, setBatchInput] = useState("");
  const [batchRows, setBatchRows] = useState<BatchInspectRow[]>([]);
  const [batchLoading, setBatchLoading] = useState(false);

  const [stagingUrl, setStagingUrl] = useState("https://staging.example.com");
  const [productionUrl, setProductionUrl] = useState("https://example.com");
  const [compareResult, setCompareResult] = useState<CompareResult | undefined>(undefined);
  const [compareLoading, setCompareLoading] = useState(false);

  const [monitorSiteUrl, setMonitorSiteUrl] = useState("http://localhost:3000");
  const [monitorResult, setMonitorResult] = useState<MonitorResult | null>(null);
  const [monitorLoading, setMonitorLoading] = useState(false);

  const [settings, setSettings] = useState<Settings>(() => readStorage(SETTINGS_KEY, defaultSettings));
  const [history, setHistory] = useState<HistoryItem[]>(() => readStorage(HISTORY_KEY, [] as HistoryItem[]));
  const [workspaces, setWorkspaces] = useState<SavedWorkspace[]>(() =>
    readStorage(WORKSPACES_KEY, [] as SavedWorkspace[]),
  );

  const [workspaceBusy, setWorkspaceBusy] = useState<string | null>(null);
  const [clipboardUrl, setClipboardUrl] = useState<string | undefined>(undefined);
  const [previewImage, setPreviewImage] = useState<{ url: string; title: string } | null>(null);

  const addHistory = useCallback((mode: HistoryItem["mode"], title: string, detail: string) => {
    if (!settings.historyEnabled) return;
    setHistory((prev) => [{ id: makeId(), mode, title, detail, createdAt: new Date().toISOString() }, ...prev]);
  }, [settings.historyEnabled]);

  const snapshotWorkspace = useCallback((): SavedWorkspace => ({
    id: makeId(),
    name: buildWorkspaceName(url),
    createdAt: new Date().toISOString(),
    url,
    batchInput,
    stagingUrl,
    productionUrl,
  }), [url, batchInput, stagingUrl, productionUrl]);

  const maybeAutoSaveWorkspace = useCallback((reason: string) => {
    if (!settings.autoSaveEnabled) return;
    const snapshot = snapshotWorkspace();
    setWorkspaces((prev) => [snapshot, ...prev].slice(0, 50));
    addHistory("single", "Auto Saved", `${snapshot.name} (${reason})`);
  }, [settings.autoSaveEnabled, snapshotWorkspace, addHistory]);

  const inspect = useCallback(async (explicitUrl?: string) => {
    const target = (explicitUrl ?? url).trim();
    if (!target) return;
    setLoading(true);
    setError(null);
    try {
      const data = await invoke<InspectResult>("inspect_url", { url: target });
      setResult(data);
      addHistory("single", target, data.validation.warnings.join(" | ") || "No warnings");
      maybeAutoSaveWorkspace("inspect");
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, [url, addHistory, maybeAutoSaveWorkspace]);

  const runMonitor = async () => {
    const target = monitorSiteUrl.trim();
    if (!target) return;
    setMonitorLoading(true);
    setError(null);
    try {
      const data = await invoke<MonitorResult>("monitor_site_metadata", { siteUrl: target, maxPages: 200 });
      setMonitorResult(data);
      addHistory("monitor", target, `Scanned ${data.pagesScanned} pages`);
      maybeAutoSaveWorkspace("monitor");
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setMonitorLoading(false);
    }
  };

  const exportMonitorPdf = async () => {
    if (!monitorResult) return;
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    doc.setFontSize(16);
    doc.text("PREVU Site Metadata Report", 40, 44);
    doc.setFontSize(10);
    doc.text(`Site: ${monitorResult.siteUrl}`, 40, 62);
    doc.text(`Discovery: ${monitorResult.discoverySource}`, 40, 76);
    doc.text(`Pages scanned: ${monitorResult.pagesScanned}`, 40, 90);
    doc.text(`Missing OG image: ${monitorResult.missingOgImage}`, 40, 104);
    doc.text(`Missing description: ${monitorResult.missingDescription}`, 40, 118);
    doc.text(`Invalid image size: ${monitorResult.invalidImageSize}`, 40, 132);
    autoTable(doc, {
      startY: 154,
      head: [["URL", "Status", "Missing OG", "Missing Desc", "Invalid Img", "Warnings"]],
      body: monitorResult.pages.map((p) => [
        p.url,
        p.status,
        p.missingOgImage ? "Yes" : "No",
        p.missingDescription ? "Yes" : "No",
        p.invalidImageSize ? "Yes" : "No",
        String(p.warningCount),
      ]),
      styles: { fontSize: 8 },
      headStyles: { fillColor: [15, 23, 42] },
    });
    const pdfBytes = doc.output("arraybuffer");
    const byteArray = Array.from(new Uint8Array(pdfBytes));
    try {
      await invoke<string | null>("save_binary_dialog", {
        defaultName: `prevu-site-report-${new Date().toISOString().replace(/[:.]/g, "-")}.pdf`,
        bytes: byteArray,
      });
    } catch {
      // fallback for environments without native save support
      doc.save("site-metadata-report.pdf");
    }
  };

  const runBatch = async () => {
    const urls = batchInput.split(/\r?\n/).map((v) => v.trim()).filter(Boolean);
    if (!urls.length) return;
    setBatchLoading(true);
    try {
      const data = await invoke<{ rows: BatchInspectRow[] }>("batch_inspect_urls", { urls });
      setBatchRows(data.rows || []);
      addHistory("batch", `${urls.length} URLs`, `${(data.rows || []).length} scanned`);
      maybeAutoSaveWorkspace("batch");
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBatchLoading(false);
    }
  };

  const runCompare = async () => {
    setCompareLoading(true);
    try {
      const data = await invoke<CompareResult>("compare_environments", { stagingUrl, productionUrl });
      setCompareResult(data);
      addHistory("compare", "Staging vs Production", `${data.differences.length} changes`);
      maybeAutoSaveWorkspace("compare");
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setCompareLoading(false);
    }
  };

  const saveWorkspaceLocal = () => {
    const item = snapshotWorkspace();
    setWorkspaces((prev) => [item, ...prev]);
    addHistory("single", "Workspace Saved", item.name);
  };

  const openWorkspaceFile = async () => {
    setWorkspaceBusy("Opening workspace file...");
    try {
      const content = await invoke<string | null>("open_workspace_dialog");
      if (!content) return;
      const parsed = JSON.parse(content) as Partial<SavedWorkspace>;
      const workspace: SavedWorkspace = {
        id: makeId(),
        name: parsed.name || buildWorkspaceName(parsed.url || url),
        createdAt: parsed.createdAt || new Date().toISOString(),
        url: parsed.url || "http://localhost:3000",
        batchInput: parsed.batchInput || "",
        stagingUrl: parsed.stagingUrl || "https://staging.example.com",
        productionUrl: parsed.productionUrl || "https://example.com",
      };
      setWorkspaces((prev) => [workspace, ...prev]);
      setUrl(workspace.url);
      setBatchInput(workspace.batchInput);
      setStagingUrl(workspace.stagingUrl);
      setProductionUrl(workspace.productionUrl);
      addHistory("single", "Workspace Imported", workspace.name);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid workspace file format");
    } finally {
      setWorkspaceBusy(null);
    }
  };

  const exportWorkspaceFile = async () => {
    setWorkspaceBusy("Exporting workspace file...");
    try {
      const payload = JSON.stringify(
        snapshotWorkspace(),
        null,
        2,
      );
      await invoke("save_workspace_dialog", { defaultName: "workspace.json", payload });
    } finally {
      setWorkspaceBusy(null);
    }
  };

  useEffect(() => {
    writeStorage(SETTINGS_KEY, settings);
  }, [settings]);
  useEffect(() => {
    writeStorage(HISTORY_KEY, history);
  }, [history]);
  useEffect(() => {
    writeStorage(WORKSPACES_KEY, workspaces);
  }, [workspaces]);

  useEffect(() => {
    if (!settings.clipboardEnabled) return;
    const timer = setInterval(async () => {
      try {
        const detected = await invoke<string | null>("read_clipboard_url");
        if (detected && detected !== clipboardUrl) {
          setClipboardUrl(detected);
          setUrl(detected);
          inspect(detected);
        }
      } catch {
        // ignore clipboard access errors
      }
    }, 1300);
    return () => clearInterval(timer);
  }, [settings.clipboardEnabled, clipboardUrl, inspect]);

  useEffect(() => {
    if (!settings.watchMode) return;
    const timer = setInterval(() => {
      inspect(url);
    }, 5000);
    return () => clearInterval(timer);
  }, [settings.watchMode, url, inspect]);

  const domain = useMemo(() => {
    try {
      return result?.resolvedUrl ? new URL(result.resolvedUrl).hostname : "domain.com";
    } catch {
      return "domain.com";
    }
  }, [result?.resolvedUrl]);

  const currentImage = result?.meta?.ogImage || result?.meta?.twitterImage;

  return (
    <main className="h-screen overflow-hidden bg-[#f3f5f8] p-2 md:p-3">
      <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-slate-300/70 bg-white shadow-[0_16px_48px_rgba(15,23,42,0.18)]">
        <header className="flex items-center justify-between border-b border-slate-200 bg-[#f7f9fc] px-4 py-2.5">
          <div className="flex items-center gap-2.5">
            <img
              src="/logo.png"
              alt="PREVU logo"
              className="h-7 w-7 rounded-md object-contain ring-1 ring-slate-200"
              loading="eager"
              decoding="async"
            />
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-600">PREVU</p>
          </div>
          <div className="flex flex-wrap items-center justify-end gap-2">
            <button className="btn-ghost" onClick={openWorkspaceFile}>Open Workspace</button>
            <button className="btn-ghost" onClick={saveWorkspaceLocal}>Save Local</button>
            <button className="btn-primary" onClick={exportWorkspaceFile}>Export</button>
            <ClipboardWatcherIndicator enabled={settings.clipboardEnabled} recentUrl={clipboardUrl} />
          </div>
        </header>

        <div className="grid min-h-0 flex-1 gap-3 p-3 xl:grid-cols-[minmax(220px,25%)_minmax(0,50%)_minmax(260px,25%)]">
          <aside className="order-2 min-h-0 overflow-auto border border-slate-200 bg-[#fafbfd] p-3 xl:order-1 xl:border-0 xl:border-r">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Workspace Views</p>
            <div className="mt-2 hidden space-y-1 lg:block">
              {views.map((view) => (
                <button key={view.key} onClick={() => setActiveView(view.key)} className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition ${activeView === view.key ? "bg-slate-900 text-white" : "text-slate-700 hover:bg-slate-100"}`}>
                  <ViewIcon view={view.key} />
                  <span>{view.label}</span>
                </button>
              ))}
            </div>
            <div className="mt-2 lg:hidden">
              <select value={activeView} onChange={(e) => setActiveView(e.target.value as ViewKey)} className="input-shell w-full">
                {views.map((view) => <option key={view.key} value={view.key}>{view.label}</option>)}
              </select>
            </div>

            <div className="mt-4 border-t border-slate-200 pt-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Saved Workspaces</p>
              <div className="mt-2 space-y-2">
                {workspaces.length === 0 ? <p className="text-xs text-slate-500">No saved workspaces.</p> : null}
                {workspaces.slice(0, 8).map((w) => (
                  <button key={w.id} onClick={() => { setUrl(w.url); setBatchInput(w.batchInput); setStagingUrl(w.stagingUrl); setProductionUrl(w.productionUrl); }} className="w-full rounded-lg border border-slate-200 bg-white px-2 py-2 text-left text-xs hover:bg-slate-50">
                    <p className="truncate font-semibold text-slate-800">{w.name}</p>
                    <p className="truncate text-slate-500">{w.url}</p>
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-4 border-t border-slate-200 pt-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Quick Settings</p>
              <div className="mt-2 space-y-2">
                <Toggle label="Auto Save" value={settings.autoSaveEnabled} onChange={(v) => setSettings((s) => ({ ...s, autoSaveEnabled: v }))} />
                <Toggle label="History" value={settings.historyEnabled} onChange={(v) => setSettings((s) => ({ ...s, historyEnabled: v }))} />
                <Toggle label="Preview" value={settings.previewEnabled} onChange={(v) => setSettings((s) => ({ ...s, previewEnabled: v }))} />
                <Toggle label="Watch" value={settings.watchMode} onChange={(v) => setSettings((s) => ({ ...s, watchMode: v }))} />
              </div>
            </div>
          </aside>

          <section className="order-1 min-h-0 overflow-auto xl:order-2">
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              {workspaceBusy ? <Loader text={workspaceBusy} /> : null}
              {error ? <p className="mb-3 text-sm text-rose-700">{error}</p> : null}

              {activeView === "inspector" ? (
                <>
                  <div className="mb-4 flex flex-wrap gap-2">
                    {tabs.map((tab) => (
                      <button key={tab.key} onClick={() => setActiveTab(tab.key)} className={activeTab === tab.key ? "rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white" : "btn-ghost"}>
                        {tab.label}
                      </button>
                    ))}
                  </div>
                  <UrlInput url={url} loading={loading} onChange={setUrl} onInspect={inspect} />
                  {result && activeTab === "preview" ? (
                    settings.previewEnabled ? (
                      <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-3">
                        <PreviewCard platform="Twitter" meta={result.meta} domain={domain} />
                        <PreviewCard platform="LinkedIn" meta={result.meta} domain={domain} />
                        <PreviewCard platform="Discord" meta={result.meta} domain={domain} />
                        <PreviewCard platform="WhatsApp" meta={result.meta} domain={domain} />
                        <PreviewCard platform="Facebook" meta={result.meta} domain={domain} />
                      </div>
                    ) : (
                      <p className="mt-4 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
                        Preview rendering is disabled in settings.
                      </p>
                    )
                  ) : null}
                  {result && activeTab === "meta" ? <div className="mt-4"><MetaTable tags={result.meta.rawTags || {}} /></div> : null}
                  {result && activeTab === "validation" ? <div className="mt-4"><ValidationPanel passed={result.validation.passed || []} warnings={result.validation.warnings || []} /></div> : null}
                  {result && activeTab === "image" ? <div className="mt-4"><ImageInspector imageInfo={result.imageInfo} /></div> : null}
                </>
              ) : null}

              {activeView === "monitor" ? (
                <>
                  <div className="panel-head">
                    <div>
                      <h2 className="panel-title">Website Metadata Monitoring</h2>
                      <p className="panel-subtitle">Scan sitemap + linked pages and summarize metadata health.</p>
                    </div>
                    <div className="flex gap-2">
                      <button className="btn-primary" onClick={runMonitor} disabled={monitorLoading}>{monitorLoading ? "Scanning..." : "Scan Site"}</button>
                      <button className="btn-ghost" onClick={exportMonitorPdf} disabled={!monitorResult}>PDF Report</button>
                    </div>
                  </div>
                  <input value={monitorSiteUrl} onChange={(e) => setMonitorSiteUrl(e.target.value)} className="input-shell w-full" placeholder="https://example.com or http://localhost:3000" />
                  {monitorLoading ? <Loader text="Scanning site pages and validating metadata..." /> : null}
                  {monitorResult ? (
                    <div className="mt-4 space-y-4">
                      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                        <Metric label="Pages scanned" value={String(monitorResult.pagesScanned)} />
                        <Metric label="Missing OG image" value={String(monitorResult.missingOgImage)} />
                        <Metric label="Missing description" value={String(monitorResult.missingDescription)} />
                        <Metric label="Invalid image size" value={String(monitorResult.invalidImageSize)} />
                      </div>
                      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                        {monitorResult.pages.slice(0, 9).map((p) => (
                          <button key={p.url} onClick={() => p.imageUrl && setPreviewImage({ url: p.imageUrl, title: p.title || p.url })} className="rounded-lg border border-slate-200 bg-white p-2 text-left hover:bg-slate-50">
                            <p className="mb-2 line-clamp-2 text-xs font-semibold text-slate-800">{p.title || p.url}</p>
                            {p.imageUrl ? <img src={p.imageUrl} alt={p.title || "preview"} className="h-24 w-full rounded-md border border-slate-200 object-cover" /> : <div className="flex h-24 items-center justify-center rounded-md border border-dashed border-slate-300 bg-slate-50 text-[11px] text-slate-500">No image</div>}
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </>
              ) : null}

              {activeView === "batch" ? <BatchInspector value={batchInput} loading={batchLoading} rows={batchRows} onChange={setBatchInput} onInspect={runBatch} /> : null}
              {activeView === "compare" ? <ComparePanel stagingUrl={stagingUrl} productionUrl={productionUrl} loading={compareLoading} result={compareResult} onStagingChange={setStagingUrl} onProductionChange={setProductionUrl} onCompare={runCompare} /> : null}
              {activeView === "history" ? <HistoryPanel items={history} onClear={() => setHistory([])} /> : null}
              {activeView === "settings" ? <SettingsPanel settings={settings} onChange={setSettings} /> : null}
            </div>
          </section>

          <aside className="order-3 min-h-0 overflow-auto border border-slate-200 bg-[#fcfdff] p-3 xl:border-0 xl:border-l">
            <div className="rounded-xl border border-slate-200 bg-white p-3">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-600">OG Asset Manager</h3>
              <div className="mt-3 space-y-2 text-xs">
                <InfoRow label="Source URL" value={url} />
                <InfoRow label="Image" value={currentImage || "No image"} breakAll />
                <InfoRow label="Warnings" value={String(result?.validation?.warnings?.length || 0)} />
                <InfoRow label="Passed" value={String(result?.validation?.passed?.length || 0)} />
              </div>
              {currentImage ? <img src={currentImage} alt="Current OG" className="mt-3 h-40 w-full rounded-lg border border-slate-200 object-cover" /> : <div className="mt-3 flex h-40 items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50 text-xs text-slate-500">No OG image loaded</div>}
            </div>
          </aside>
        </div>

        <footer className="border-t border-slate-200 bg-[#f8fafd] px-4 py-2 text-center text-xs text-slate-600">
          Build with love {"\u2764\uFE0F"} by <a className="text-slate-700 underline" href="https://akadhanu.pages.dev" target="_blank" rel="noreferrer">Dhanu </a>
        </footer>
      </div>

      {previewImage ? (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4" onClick={() => setPreviewImage(null)}>
          <div className="max-h-[90vh] w-full max-w-5xl rounded-xl bg-white p-3 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-2 flex items-center justify-between gap-3">
              <p className="truncate text-sm font-semibold text-slate-900">{previewImage.title}</p>
              <button className="btn-ghost" onClick={() => setPreviewImage(null)}>Close</button>
            </div>
            <img src={previewImage.url} alt={previewImage.title} className="max-h-[80vh] w-full rounded-lg border border-slate-200 object-contain" />
          </div>
        </div>
      ) : null}
    </main>
  );
}

function InfoRow({ label, value, breakAll = false }: { label: string; value: string; breakAll?: boolean }) {
  return <div className="rounded-md border border-slate-200 bg-slate-50 px-2.5 py-2"><p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">{label}</p><p className={`mt-1 text-xs text-slate-800 ${breakAll ? "break-all" : "truncate"}`}>{value}</p></div>;
}

function ViewIcon({ view }: { view: ViewKey }) {
  const iconClass = "h-3.5 w-3.5 shrink-0";
  if (view === "inspector") {
    return (
      <svg viewBox="0 0 24 24" className={iconClass} fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="11" cy="11" r="7" />
        <path d="m21 21-4.3-4.3" />
      </svg>
    );
  }
  if (view === "monitor") {
    return (
      <svg viewBox="0 0 24 24" className={iconClass} fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M3 12h4l2-6 4 12 2-6h6" />
      </svg>
    );
  }
  if (view === "batch") {
    return (
      <svg viewBox="0 0 24 24" className={iconClass} fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="4" width="18" height="4" rx="1" />
        <rect x="3" y="10" width="18" height="4" rx="1" />
        <rect x="3" y="16" width="18" height="4" rx="1" />
      </svg>
    );
  }
  if (view === "compare") {
    return (
      <svg viewBox="0 0 24 24" className={iconClass} fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M6 7h9M6 17h12" />
        <path d="m15 4 3 3-3 3M12 14l3 3-3 3" />
      </svg>
    );
  }
  if (view === "history") {
    return (
      <svg viewBox="0 0 24 24" className={iconClass} fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M3 12a9 9 0 1 0 3-6.7" />
        <path d="M3 3v6h6" />
        <path d="M12 7v5l3 2" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" className={iconClass} fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 0 1 0 2.8l-.2.2a2 2 0 0 1-2.8 0l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 0 1-2 2h-.3a2 2 0 0 1-2-2v-.1a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 0 1-2.8 0l-.2-.2a2 2 0 0 1 0-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 0 1-2-2v-.3a2 2 0 0 1 2-2h.1a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 0 1 0-2.8l.2-.2a2 2 0 0 1 2.8 0l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 0 1 2-2h.3a2 2 0 0 1 2 2v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 0 1 2.8 0l.2.2a2 2 0 0 1 0 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 0 1 2 2v.3a2 2 0 0 1-2 2h-.1a1.7 1.7 0 0 0-1.5 1z" />
    </svg>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2"><p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{label}</p><p className="mt-1 text-lg font-semibold text-slate-900">{value}</p></div>;
}

function Loader({ text }: { text: string }) {
  return <div className="mb-3 mt-1 flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700"><span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-slate-300 border-t-slate-700" />{text}</div>;
}

function SettingsPanel({ settings, onChange }: { settings: Settings; onChange: (updater: (s: Settings) => Settings) => void }) {
  return (
    <div className="grid gap-3 md:grid-cols-2">
      <Toggle label="Auto-save results" value={settings.autoSaveEnabled} onChange={(v) => onChange((s) => ({ ...s, autoSaveEnabled: v }))} />
      <Toggle label="Enable history" value={settings.historyEnabled} onChange={(v) => onChange((s) => ({ ...s, historyEnabled: v }))} />
      <Toggle label="Enable previews" value={settings.previewEnabled} onChange={(v) => onChange((s) => ({ ...s, previewEnabled: v }))} />
      <Toggle label="Watch mode" value={settings.watchMode} onChange={(v) => onChange((s) => ({ ...s, watchMode: v }))} />
      <Toggle label="Clipboard auto preview" value={settings.clipboardEnabled} onChange={(v) => onChange((s) => ({ ...s, clipboardEnabled: v }))} />
    </div>
  );
}

function HistoryPanel({ items, onClear }: { items: HistoryItem[]; onClear: () => void }) {
  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-900">Run History</h2>
        <button className="btn-ghost" onClick={onClear}>Clear</button>
      </div>
      <div className="space-y-2">
        {items.length === 0 ? <p className="text-sm text-slate-500">No history yet.</p> : null}
        {items.map((i) => (
          <div key={i.id} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
            <p className="text-xs font-semibold text-slate-800">[{i.mode.toUpperCase()}] {i.title}</p>
            <p className="mt-1 text-xs text-slate-600">{i.detail}</p>
            <p className="mt-1 text-[11px] text-slate-400">{new Date(i.createdAt).toLocaleString()}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function Toggle({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs">
      <span className="text-slate-700">{label}</span>
      <input type="checkbox" checked={value} onChange={(e) => onChange(e.target.checked)} className="h-4 w-4 rounded border-slate-300" />
    </label>
  );
}
