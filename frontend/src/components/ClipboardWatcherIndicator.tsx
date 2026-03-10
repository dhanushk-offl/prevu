type ClipboardWatcherIndicatorProps = {
  enabled: boolean;
  recentUrl?: string;
};

export default function ClipboardWatcherIndicator({
  enabled,
  recentUrl,
}: ClipboardWatcherIndicatorProps) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
      <span className="font-semibold text-slate-800">Clipboard</span>: {enabled ? "Active" : "Off"}
      {enabled && recentUrl ? (
        <span className="ml-2 inline-block max-w-[220px] truncate align-bottom text-slate-500" title={recentUrl}>
          {recentUrl}
        </span>
      ) : null}
    </div>
  );
}
