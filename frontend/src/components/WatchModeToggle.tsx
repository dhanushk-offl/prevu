type WatchModeToggleProps = {
  enabled: boolean;
  onChange: (value: boolean) => void;
};

export default function WatchModeToggle({ enabled, onChange }: WatchModeToggleProps) {
  return (
    <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 shadow-sm">
      <input
        type="checkbox"
        checked={enabled}
        onChange={(event) => onChange(event.target.checked)}
        className="h-4 w-4 rounded border-slate-300 text-slate-900"
      />
      Watch mode
    </label>
  );
}
