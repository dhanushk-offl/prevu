import { Switch } from "./ui/switch";

type WatchModeToggleProps = {
  enabled: boolean;
  onChange: (value: boolean) => void;
};

export default function WatchModeToggle({ enabled, onChange }: WatchModeToggleProps) {
  return (
    <label className="inline-flex cursor-pointer items-center gap-2 border border-[var(--line)] bg-white px-3 py-2 text-xs font-medium text-slate-700">
      <Switch checked={enabled} onCheckedChange={onChange} aria-label="Watch mode" />
      Watch mode
    </label>
  );
}
