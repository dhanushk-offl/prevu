type ClipboardWatcherIndicatorProps = {
  enabled: boolean;
  recentUrl?: string;
  compact?: boolean;
};

export default function ClipboardWatcherIndicator({
  enabled,
  recentUrl,
  compact = false,
}: ClipboardWatcherIndicatorProps) {
  if (compact) {
    return (
      <div
        className={`border px-2.5 py-1.5 text-[11px] font-semibold ${
          enabled
            ? "border-emerald-300 bg-emerald-50 text-emerald-700"
            : "border-[var(--line)] bg-[var(--surface-soft)] text-slate-500"
        }`}
        title={enabled ? recentUrl || "Clipboard watcher active" : "Clipboard watcher off"}
      >
        {enabled ? "CB On" : "CB Off"}
      </div>
    );
  }

  return (
    <div className="max-w-[260px] border border-[var(--line)] bg-[var(--surface-soft)] px-3 py-1.5 text-xs text-slate-600">
      <span className="font-semibold text-slate-800">Clipboard</span>: {enabled ? "Active" : "Off"}
      {enabled && recentUrl ? (
        <span className="ml-2 inline-block max-w-[160px] truncate align-bottom text-slate-500" title={recentUrl}>
          {recentUrl}
        </span>
      ) : null}
    </div>
  );
}
