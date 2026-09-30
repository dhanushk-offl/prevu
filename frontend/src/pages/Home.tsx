import { useCallback, useEffect, useMemo, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { Bug, Export, FolderOpen, GithubLogo, HardDrives, Star } from "@phosphor-icons/react";

import BatchInspector, { BatchInspectRow } from "../components/BatchInspector";
import ClipboardWatcherIndicator from "../components/ClipboardWatcherIndicator";
import ComparePanel, { CompareResult } from "../components/ComparePanel";
import ImageInspector, { ImageInfo } from "../components/ImageInspector";
import MetaTable from "../components/MetaTable";
import PreviewCard, { MetaData } from "../components/PreviewCard";
import TitleBar from "../components/TitleBar";
import UpdateDialog from "../components/UpdateDialog";
import UrlInput from "../components/UrlInput";
import ValidationPanel from "../components/ValidationPanel";
import ViewSelector, { type ViewKey } from "../components/ViewSelector";
import { Switch } from "../components/ui/switch";
import { useViewport } from "../hooks/useViewport";
import {
  dismissUpdateVersion,
  fetchLatestRelease,
  isNewerVersion,
  normalizeVersion,
  readDismissedVersion,
  type LatestRelease,
} from "../lib/updates";

const APP_NAME = "PREVU";
const APP_VERSION = "0.1.6";
const APP_AUTHOR = "dhanushk-offl";
const REPO_URL = "https://github.com/dhanushk-offl/prevu";
const ISSUES_URL = "https://github.com/dhanushk-offl/prevu/issues/new";
const STAR_URL = "https://github.com/dhanushk-offl/prevu";

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

type TabKey = "preview" | "meta" | "validation" | "image";

const views: { key: ViewKey; label: string; hint: string }[] = [
  { key: "inspector", label: "Inspector", hint: "Preview a single URL" },
  { key: "monitor", label: "Site Monitor", hint: "Scan site-wide metadata" },
  { key: "batch", label: "Batch", hint: "Inspect many URLs at once" },
  { key: "compare", label: "Compare", hint: "Staging vs production" },
  { key: "history", label: "History", hint: "Recent runs and saves" },
  { key: "settings", label: "Settings", hint: "Preferences and about" },
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
  const [updateRelease, setUpdateRelease] = useState<LatestRelease | null>(null);

  const viewport = useViewport();
  const showAssetPanel = viewport.isWide;
  const showSideRail = !viewport.isCompact;
  const compactChrome = viewport.width < 1080;

  const shellGridClass = viewport.isWide
    ? "xl:grid-cols-[minmax(220px,240px)_minmax(0,1fr)_minmax(240px,280px)]"
    : viewport.isMedium
      ? "md:grid-cols-[minmax(200px,230px)_minmax(0,1fr)]"
      : "grid-cols-1";

  const addHistory = useCallback(
    (mode: HistoryItem["mode"], title: string, detail: string) => {
      if (!settings.historyEnabled) return;
      setHistory((prev) => [{ id: makeId(), mode, title, detail, createdAt: new Date().toISOString() }, ...prev]);
    },
    [settings.historyEnabled],
  );

  const snapshotWorkspace = useCallback(
    (): SavedWorkspace => ({
      id: makeId(),
      name: buildWorkspaceName(url),
      createdAt: new Date().toISOString(),
      url,
      batchInput,
      stagingUrl,
      productionUrl,
    }),
    [url, batchInput, stagingUrl, productionUrl],
  );

  const maybeAutoSaveWorkspace = useCallback(
    (reason: string) => {
      if (!settings.autoSaveEnabled) return;
      const snapshot = snapshotWorkspace();
      setWorkspaces((prev) => [snapshot, ...prev].slice(0, 50));
      addHistory("single", "Auto Saved", `${snapshot.name} (${reason})`);
    },
    [settings.autoSaveEnabled, snapshotWorkspace, addHistory],
  );

  const inspect = useCallback(
    async (explicitUrl?: string) => {
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
    },
    [url, addHistory, maybeAutoSaveWorkspace],
  );

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
      doc.save("site-metadata-report.pdf");
    }
  };

  const runBatch = async () => {
    const urls = batchInput
      .split(/\r?\n/)
      .map((v) => v.trim())
      .filter(Boolean);
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
      await invoke("save_workspace_dialog", {
        defaultName: "workspace.json",
        payload: JSON.stringify(snapshotWorkspace(), null, 2),
      });
    } finally {
      setWorkspaceBusy(null);
    }
  };

  const openExternal = useCallback(async (target: string) => {
    try {
      await invoke("open_external_url", { url: target });
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }, []);

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
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      try {
        const latest = await fetchLatestRelease(controller.signal);
        if (!latest || !isNewerVersion(latest.version, APP_VERSION)) return;
        const dismissed = readDismissedVersion();
        if (dismissed && normalizeVersion(dismissed) === latest.version) return;
        setUpdateRelease(latest);
      } catch {
        // Silent: offline / rate-limit should not interrupt the app.
      }
    }, 1200);
    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, []);

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
    <main className="flex h-screen flex-col overflow-hidden bg-[var(--bg)]">
      <TitleBar title={APP_NAME} />
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <header className="flex items-center justify-between gap-3 border-b border-[var(--line)] bg-[var(--surface)] px-3 py-2">
          <div className="flex min-w-0 items-center gap-2.5">
            <img
              src="/logo.png"
              alt="PREVU logo"
              className="h-6 w-6 shrink-0 object-contain"
              loading="eager"
              decoding="async"
            />
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-600">Workspace</p>
              <p className="hidden truncate text-[10px] text-slate-400 sm:block">Let’s begin here</p>
            </div>
          </div>
          <div className="flex min-w-0 flex-wrap items-center justify-end gap-1.5">
            <button className="btn-ghost inline-flex items-center gap-1.5" onClick={openWorkspaceFile} title="Open Workspace">
              <FolderOpen size={14} weight="bold" />
              <span className={compactChrome ? "sr-only" : ""}>Open Workspace</span>
            </button>
            <button className="btn-ghost inline-flex items-center gap-1.5" onClick={saveWorkspaceLocal} title="Save Local">
              <HardDrives size={14} weight="bold" />
              <span className={compactChrome ? "sr-only" : ""}>Save Local</span>
            </button>
            <button className="btn-primary inline-flex items-center gap-1.5" onClick={exportWorkspaceFile} title="Export">
              <Export size={14} weight="bold" />
              <span className={compactChrome ? "sr-only" : ""}>Export</span>
            </button>
            <button
              type="button"
              className="btn-ghost inline-flex items-center gap-1.5 text-rose-700 hover:bg-rose-50"
              onClick={() => openExternal(ISSUES_URL)}
              title="Report a bug on GitHub"
            >
              <Bug size={14} weight="bold" />
              <span className={compactChrome ? "sr-only" : ""}>Report Bug</span>
            </button>
            <ClipboardWatcherIndicator
              enabled={settings.clipboardEnabled}
              recentUrl={clipboardUrl}
              compact={compactChrome}
            />
          </div>
        </header>

        <div className={`app-shell-grid min-h-0 flex-1 ${shellGridClass}`}>
          <aside
            className={`min-h-0 overflow-auto border-r border-[var(--line)] bg-[var(--surface-soft)] p-3 ${
              showSideRail ? "order-1" : "order-2 max-h-[42vh] border-r-0 border-t"
            }`}
          >
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Workspace Views</p>
            <div className="mt-2">
              <ViewSelector views={views} value={activeView} onChange={setActiveView} />
            </div>

            <div className="mt-4 border-t border-[var(--line)] pt-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Saved Workspaces</p>
              <div className="mt-2 divide-y divide-[var(--line)] border border-[var(--line)] bg-white">
                {workspaces.length === 0 ? (
                  <p className="px-2 py-2 text-xs text-slate-500">No saved workspaces.</p>
                ) : null}
                {workspaces.slice(0, showSideRail ? 8 : 4).map((w) => (
                  <button
                    key={w.id}
                    onClick={() => {
                      setUrl(w.url);
                      setBatchInput(w.batchInput);
                      setStagingUrl(w.stagingUrl);
                      setProductionUrl(w.productionUrl);
                    }}
                    className="w-full px-2 py-2 text-left text-xs hover:bg-[var(--surface-muted)]"
                  >
                    <p className="truncate font-semibold text-slate-800">{w.name}</p>
                    <p className="truncate text-slate-500">{w.url}</p>
                  </button>
                ))}
              </div>
            </div>
          </aside>

          <section className={`order-1 min-h-0 overflow-auto bg-[var(--bg)] p-3 ${showSideRail ? "md:order-2" : "order-1"}`}>
            <div className="border border-[var(--line)] bg-white p-3 sm:p-4">
              {workspaceBusy ? <Loader text={workspaceBusy} /> : null}
              {error ? <p className="mb-3 border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p> : null}

              {activeView === "inspector" ? (
                <>
                  <div className="mb-3 flex flex-wrap gap-1.5 border-b border-[var(--line)] pb-3">
                    {tabs.map((tab) => (
                      <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key)}
                        className={
                          activeTab === tab.key
                            ? "border border-slate-900 bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white"
                            : "btn-ghost"
                        }
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>
                  <UrlInput url={url} loading={loading} onChange={setUrl} onInspect={inspect} />
                  {result && activeTab === "preview" ? (
                    settings.previewEnabled ? (
                      <div className="preview-grid mt-4">
                        <PreviewCard platform="Twitter" meta={result.meta} domain={domain} />
                        <PreviewCard platform="LinkedIn" meta={result.meta} domain={domain} />
                        <PreviewCard platform="Facebook" meta={result.meta} domain={domain} />
                        <PreviewCard platform="Discord" meta={result.meta} domain={domain} />
                        <PreviewCard platform="WhatsApp" meta={result.meta} domain={domain} />
                        <PreviewCard platform="Slack" meta={result.meta} domain={domain} />
                      </div>
                    ) : (
                      <p className="mt-4 border border-[var(--line)] bg-[var(--surface-soft)] px-3 py-2 text-xs text-slate-600">
                        Preview rendering is disabled in settings.
                      </p>
                    )
                  ) : null}
                  {result && activeTab === "meta" ? (
                    <div className="mt-4">
                      <MetaTable tags={result.meta.rawTags || {}} />
                    </div>
                  ) : null}
                  {result && activeTab === "validation" ? (
                    <div className="mt-4">
                      <ValidationPanel
                        passed={result.validation.passed || []}
                        warnings={result.validation.warnings || []}
                      />
                    </div>
                  ) : null}
                  {result && activeTab === "image" ? (
                    <div className="mt-4">
                      <ImageInspector imageInfo={result.imageInfo} />
                    </div>
                  ) : null}

                  {!showAssetPanel && result ? (
                    <div className="mt-4 border border-[var(--line)] bg-[var(--surface-soft)] p-3">
                      <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-600">OG Asset Snapshot</h3>
                      <div className="mt-2 grid gap-0 border border-[var(--line)] bg-white sm:grid-cols-2 lg:grid-cols-4">
                        <InfoRow
                          label="Dimensions"
                          value={
                            result.imageInfo ? `${result.imageInfo.width} × ${result.imageInfo.height} px` : "—"
                          }
                        />
                        <InfoRow
                          label="File size"
                          value={
                            result.imageInfo ? `${(result.imageInfo.fileSizeBytes / 1024).toFixed(1)} KB` : "—"
                          }
                        />
                        <InfoRow label="Format" value={result.imageInfo?.format || "—"} />
                        <InfoRow
                          label="Aspect"
                          value={result.imageInfo ? `${result.imageInfo.aspectRatio.toFixed(2)}:1` : "—"}
                        />
                      </div>
                      {currentImage ? (
                        <div className="mt-3 flex max-h-44 items-center justify-center overflow-hidden border border-[var(--line)] bg-white p-1">
                          <img src={currentImage} alt="Current OG" className="max-h-44 w-full object-contain" />
                        </div>
                      ) : null}
                    </div>
                  ) : null}
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
                      <button className="btn-primary" onClick={runMonitor} disabled={monitorLoading}>
                        {monitorLoading ? "Scanning..." : "Scan Site"}
                      </button>
                      <button className="btn-ghost" onClick={exportMonitorPdf} disabled={!monitorResult}>
                        PDF Report
                      </button>
                    </div>
                  </div>
                  <input
                    value={monitorSiteUrl}
                    onChange={(e) => setMonitorSiteUrl(e.target.value)}
                    className="input-shell w-full"
                    placeholder="https://example.com or http://localhost:3000"
                  />
                  {monitorLoading ? <Loader text="Scanning site pages and validating metadata..." /> : null}
                  {monitorResult ? (
                    <div className="mt-4 space-y-4">
                      <div className="grid gap-0 border border-[var(--line)] sm:grid-cols-2 lg:grid-cols-4">
                        <Metric label="Pages scanned" value={String(monitorResult.pagesScanned)} />
                        <Metric label="Missing OG image" value={String(monitorResult.missingOgImage)} />
                        <Metric label="Missing description" value={String(monitorResult.missingDescription)} />
                        <Metric label="Invalid image size" value={String(monitorResult.invalidImageSize)} />
                      </div>
                      <div className="grid gap-0 border border-[var(--line)] md:grid-cols-2 xl:grid-cols-3">
                        {monitorResult.pages.slice(0, 9).map((p) => (
                          <button
                            key={p.url}
                            onClick={() => p.imageUrl && setPreviewImage({ url: p.imageUrl, title: p.title || p.url })}
                            className="border-b border-[var(--line)] bg-white p-2 text-left hover:bg-[var(--surface-muted)] md:border-r"
                          >
                            <p className="mb-2 line-clamp-2 text-xs font-semibold text-slate-800">{p.title || p.url}</p>
                            {p.imageUrl ? (
                              <img
                                src={p.imageUrl}
                                alt={p.title || "preview"}
                                className="h-24 w-full border border-[var(--line)] object-contain"
                              />
                            ) : (
                              <div className="flex h-24 items-center justify-center border border-dashed border-slate-300 bg-[var(--surface-soft)] text-[11px] text-slate-500">
                                No image
                              </div>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </>
              ) : null}

              {activeView === "batch" ? (
                <BatchInspector
                  value={batchInput}
                  loading={batchLoading}
                  rows={batchRows}
                  onChange={setBatchInput}
                  onInspect={runBatch}
                />
              ) : null}
              {activeView === "compare" ? (
                <ComparePanel
                  stagingUrl={stagingUrl}
                  productionUrl={productionUrl}
                  loading={compareLoading}
                  result={compareResult}
                  onStagingChange={setStagingUrl}
                  onProductionChange={setProductionUrl}
                  onCompare={runCompare}
                />
              ) : null}
              {activeView === "history" ? <HistoryPanel items={history} onClear={() => setHistory([])} /> : null}
              {activeView === "settings" ? (
                <SettingsPanel settings={settings} onChange={setSettings} onOpenExternal={openExternal} />
              ) : null}
            </div>
          </section>

          {showAssetPanel ? (
            <aside className="order-3 min-h-0 overflow-auto border-l border-[var(--line)] bg-[var(--surface-soft)] p-3">
              <div className="border border-[var(--line)] bg-white">
                <div className="border-b border-[var(--line)] px-3 py-2">
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-600">OG Asset Manager</h3>
                </div>
                <div className="divide-y divide-[var(--line)]">
                  <InfoRow label="Source URL" value={url} />
                  <InfoRow label="Image URL" value={currentImage || "No image"} breakAll />
                  <InfoRow
                    label="Dimensions"
                    value={
                      result?.imageInfo ? `${result.imageInfo.width} × ${result.imageInfo.height} px` : "—"
                    }
                  />
                  <InfoRow
                    label="File size"
                    value={
                      result?.imageInfo ? `${(result.imageInfo.fileSizeBytes / 1024).toFixed(1)} KB` : "—"
                    }
                  />
                  <InfoRow label="Format" value={result?.imageInfo?.format || "—"} />
                  <InfoRow
                    label="Aspect ratio"
                    value={result?.imageInfo ? `${result.imageInfo.aspectRatio.toFixed(2)}:1` : "—"}
                  />
                </div>
                {currentImage ? (
                  <div className="flex max-h-52 items-center justify-center overflow-hidden border-t border-[var(--line)] bg-white p-1">
                    <img src={currentImage} alt="Current OG" className="max-h-52 w-full object-contain" />
                  </div>
                ) : (
                  <div className="flex h-40 items-center justify-center border-t border-dashed border-slate-300 bg-[var(--surface-soft)] text-xs text-slate-500">
                    No OG image loaded
                  </div>
                )}
              </div>
            </aside>
          ) : null}
        </div>
      </div>

      {updateRelease ? (
        <UpdateDialog
          currentVersion={APP_VERSION}
          latestVersion={updateRelease.version}
          releaseName={updateRelease.name}
          releaseNotes={updateRelease.body}
          releaseUrl={updateRelease.htmlUrl}
          onClose={() => {
            dismissUpdateVersion(updateRelease.version);
            setUpdateRelease(null);
          }}
          onUpdate={() => {
            openExternal(updateRelease.htmlUrl);
            dismissUpdateVersion(updateRelease.version);
            setUpdateRelease(null);
          }}
        />
      ) : null}

      {previewImage ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
          onClick={() => setPreviewImage(null)}
        >
          <div className="max-h-[90vh] w-full max-w-5xl border border-[var(--line)] bg-white p-3" onClick={(e) => e.stopPropagation()}>
            <div className="mb-2 flex items-center justify-between gap-3 border-b border-[var(--line)] pb-2">
              <p className="truncate text-sm font-semibold text-slate-900">{previewImage.title}</p>
              <button className="btn-ghost" onClick={() => setPreviewImage(null)}>
                Close
              </button>
            </div>
            <img
              src={previewImage.url}
              alt={previewImage.title}
              className="max-h-[80vh] w-full border border-[var(--line)] object-contain"
            />
          </div>
        </div>
      ) : null}
    </main>
  );
}

function InfoRow({ label, value, breakAll = false }: { label: string; value: string; breakAll?: boolean }) {
  return (
    <div className="bg-white px-2.5 py-2">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className={`mt-1 text-xs text-slate-800 ${breakAll ? "break-all" : "truncate"}`}>{value}</p>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-b border-[var(--line)] bg-white px-3 py-2 sm:border-r">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-lg font-semibold text-slate-900">{value}</p>
    </div>
  );
}

function Loader({ text }: { text: string }) {
  return (
    <div className="mb-3 mt-1 flex items-center gap-2 border border-[var(--line)] bg-[var(--surface-soft)] px-3 py-2 text-xs text-slate-700">
      <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-slate-300 border-t-slate-700" />
      {text}
    </div>
  );
}

function SettingsPanel({
  settings,
  onChange,
  onOpenExternal,
}: {
  settings: Settings;
  onChange: (updater: (s: Settings) => Settings) => void;
  onOpenExternal: (url: string) => void;
}) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="mb-3 text-sm font-semibold text-slate-900">Preferences</h2>
        <div className="grid gap-0 border border-[var(--line)] md:grid-cols-2">
          <Toggle
            label="Auto-save results"
            value={settings.autoSaveEnabled}
            onChange={(v) => onChange((s) => ({ ...s, autoSaveEnabled: v }))}
          />
          <Toggle
            label="Enable history"
            value={settings.historyEnabled}
            onChange={(v) => onChange((s) => ({ ...s, historyEnabled: v }))}
          />
          <Toggle
            label="Enable previews"
            value={settings.previewEnabled}
            onChange={(v) => onChange((s) => ({ ...s, previewEnabled: v }))}
          />
          <Toggle
            label="Watch mode"
            value={settings.watchMode}
            onChange={(v) => onChange((s) => ({ ...s, watchMode: v }))}
          />
          <Toggle
            label="Clipboard auto preview"
            value={settings.clipboardEnabled}
            onChange={(v) => onChange((s) => ({ ...s, clipboardEnabled: v }))}
          />
        </div>
      </div>

      <div>
        <h2 className="mb-3 text-sm font-semibold text-slate-900">About</h2>
        <div className="border border-[var(--line)] bg-[var(--surface-soft)]">
          <div className="flex items-start gap-3 border-b border-[var(--line)] bg-white p-4">
            <img src="/logo.png" alt="PREVU logo" className="h-12 w-12 object-contain" />
            <div className="min-w-0 flex-1 space-y-2 text-sm">
              <AboutRow label="Name" value={APP_NAME} />
              <AboutRow label="Version" value={APP_VERSION} />
              <AboutRow label="Author" value={APP_AUTHOR} />
              <AboutRow label="Repository" value={REPO_URL} />
            </div>
          </div>
          <div className="flex flex-wrap gap-2 p-3">
            <button type="button" className="btn-ghost inline-flex items-center gap-1.5" onClick={() => onOpenExternal(REPO_URL)}>
              <GithubLogo size={14} weight="bold" />
              Open Repo
            </button>
            <button
              type="button"
              className="btn-ghost inline-flex items-center gap-1.5 text-rose-700 hover:bg-rose-50"
              onClick={() => onOpenExternal(ISSUES_URL)}
            >
              <Bug size={14} weight="bold" />
              Report Bug
            </button>
            <button type="button" className="btn-primary inline-flex items-center gap-1.5" onClick={() => onOpenExternal(STAR_URL)}>
              <Star size={14} weight="fill" />
              Star Now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function AboutRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[88px_minmax(0,1fr)] gap-2 text-xs">
      <span className="font-semibold uppercase tracking-wide text-slate-500">{label}</span>
      <span className="truncate text-slate-800" title={value}>
        {value}
      </span>
    </div>
  );
}

function HistoryPanel({ items, onClear }: { items: HistoryItem[]; onClear: () => void }) {
  return (
    <div>
      <div className="mb-3 flex items-center justify-between border-b border-[var(--line)] pb-2">
        <h2 className="text-sm font-semibold text-slate-900">Run History</h2>
        <button className="btn-ghost" onClick={onClear}>
          Clear
        </button>
      </div>
      <div className="divide-y divide-[var(--line)] border border-[var(--line)]">
        {items.length === 0 ? <p className="px-3 py-3 text-sm text-slate-500">No history yet.</p> : null}
        {items.map((i) => (
          <div key={i.id} className="bg-white px-3 py-3">
            <p className="text-xs font-semibold text-slate-800">
              [{i.mode.toUpperCase()}] {i.title}
            </p>
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
    <label className="flex items-center justify-between gap-3 border-b border-[var(--line)] bg-white px-3 py-2.5 text-xs md:border-r">
      <span className="font-medium text-slate-700">{label}</span>
      <Switch checked={value} onCheckedChange={onChange} aria-label={label} />
    </label>
  );
}
