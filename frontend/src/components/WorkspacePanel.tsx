export type WorkspaceHistoryItem = {
  id: string;
  mode: "single" | "batch" | "compare";
  title: string;
  detail: string;
  createdAt: string;
};

type WorkspacePanelProps = {
  autoSaveEnabled: boolean;
  historyEnabled: boolean;
  previewEnabled: boolean;
  watchMode: boolean;
  clipboardEnabled: boolean;
  history: WorkspaceHistoryItem[];
  onAutoSaveChange: (value: boolean) => void;
  onHistoryChange: (value: boolean) => void;
  onPreviewChange: (value: boolean) => void;
  onWatchModeChange: (value: boolean) => void;
  onClipboardChange: (value: boolean) => void;
  onClearHistory: () => void;
  onReplay: (item: WorkspaceHistoryItem) => void;
};

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
}

export default function WorkspacePanel({
  autoSaveEnabled,
  historyEnabled,
  previewEnabled,
  watchMode,
  clipboardEnabled,
  history,
  onAutoSaveChange,
  onHistoryChange,
  onPreviewChange,
  onWatchModeChange,
  onClipboardChange,
  onClearHistory,
  onReplay,
}: WorkspacePanelProps) {
  return (
    <aside className="panel h-full p-4">
      <div>
        <h2 className="text-sm font-semibold tracking-wide text-slate-900">Workspace</h2>
        <p className="mt-1 text-xs text-slate-500">Local-first settings and run history.</p>
      </div>

      <div className="mt-4 space-y-2 text-xs">
        <Toggle label="Auto-save results" value={autoSaveEnabled} onChange={onAutoSaveChange} />
        <Toggle label="Enable history" value={historyEnabled} onChange={onHistoryChange} />
        <Toggle label="Enable previews" value={previewEnabled} onChange={onPreviewChange} />
        <Toggle label="Watch mode" value={watchMode} onChange={onWatchModeChange} />
        <Toggle label="Clipboard auto preview" value={clipboardEnabled} onChange={onClipboardChange} />
      </div>

      <div className="mt-4 border-t border-slate-100 pt-3">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-700">History</h3>
          <button className="btn-ghost py-1" onClick={onClearHistory}>
            Clear
          </button>
        </div>

        <div className="max-h-[420px] space-y-2 overflow-auto pr-1">
          {history.length === 0 ? <p className="text-xs text-slate-500">No saved logs yet.</p> : null}
          {history.map((item) => (
            <button
              key={item.id}
              onClick={() => onReplay(item)}
              className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-left text-xs transition hover:border-slate-300 hover:bg-slate-50"
            >
              <p className="font-semibold text-slate-800">[{item.mode.toUpperCase()}] {item.title}</p>
              <p className="truncate text-slate-500" title={item.detail}>{item.detail}</p>
              <p className="mt-1 text-[11px] text-slate-400">{formatDate(item.createdAt)}</p>
            </button>
          ))}
        </div>
      </div>
    </aside>
  );
}

type ToggleProps = {
  label: string;
  value: boolean;
  onChange: (value: boolean) => void;
};

function Toggle({ label, value, onChange }: ToggleProps) {
  return (
    <label className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
      <span className="text-slate-700">{label}</span>
      <input
        type="checkbox"
        checked={value}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 rounded border-slate-300"
      />
    </label>
  );
}
