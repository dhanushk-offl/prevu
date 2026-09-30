import { ArrowSquareOut, DownloadSimple, X } from "@phosphor-icons/react";

type UpdateDialogProps = {
  currentVersion: string;
  latestVersion: string;
  releaseName: string;
  releaseNotes?: string;
  releaseUrl: string;
  onUpdate: () => void;
  onClose: () => void;
};

export default function UpdateDialog({
  currentVersion,
  latestVersion,
  releaseName,
  releaseNotes,
  releaseUrl,
  onUpdate,
  onClose,
}: UpdateDialogProps) {
  const snippet = (releaseNotes || "")
    .replace(/\r/g, "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 4)
    .join(" ");

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/40 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="update-dialog-title"
    >
      <div className="w-full max-w-md overflow-hidden border border-[var(--line)] bg-white">
        <div className="flex items-start justify-between gap-3 border-b border-[var(--line)] px-4 py-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Update available</p>
            <h2 id="update-dialog-title" className="mt-1 text-sm font-semibold text-slate-900">
              {releaseName || `PREVU ${latestVersion}`}
            </h2>
          </div>
          <button
            type="button"
            className="border border-[var(--line)] p-1 text-slate-500 transition hover:bg-[var(--surface-muted)] hover:text-slate-800"
            onClick={onClose}
            aria-label="Close update dialog"
          >
            <X size={16} weight="bold" />
          </button>
        </div>

        <div className="space-y-3 px-4 py-4 text-sm text-slate-700">
          <p>
            A newer version is available. You are on <span className="font-semibold">v{currentVersion}</span>; latest is{" "}
            <span className="font-semibold">v{latestVersion}</span>.
          </p>
          {snippet ? (
            <p className="border border-[var(--line)] bg-[var(--surface-soft)] px-3 py-2 text-xs leading-relaxed text-slate-600">
              {snippet}
            </p>
          ) : null}
          <a
            href={releaseUrl}
            onClick={(event) => {
              event.preventDefault();
              onUpdate();
            }}
            className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 underline-offset-2 hover:text-slate-800 hover:underline"
          >
            View release notes
            <ArrowSquareOut size={12} weight="bold" />
          </a>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-[var(--line)] bg-[var(--surface-soft)] px-4 py-3">
          <button type="button" className="btn-ghost" onClick={onClose}>
            Not now
          </button>
          <button type="button" className="btn-primary inline-flex items-center gap-1.5" onClick={onUpdate}>
            <DownloadSimple size={14} weight="bold" />
            Update now
          </button>
        </div>
      </div>
    </div>
  );
}
