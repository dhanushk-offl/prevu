import { useEffect, useRef, useState } from "react";
import {
  ArrowsLeftRight,
  CaretDown,
  Check,
  ClockCounterClockwise,
  GearSix,
  ListBullets,
  MagnifyingGlass,
  Pulse,
} from "@phosphor-icons/react";

export type ViewKey = "inspector" | "monitor" | "batch" | "compare" | "history" | "settings";

type ViewOption = {
  key: ViewKey;
  label: string;
  hint: string;
};

type ViewSelectorProps = {
  views: ViewOption[];
  value: ViewKey;
  onChange: (view: ViewKey) => void;
};

function ViewIcon({ view }: { view: ViewKey }) {
  const props = { size: 15, weight: "bold" as const, className: "shrink-0" };
  if (view === "inspector") return <MagnifyingGlass {...props} />;
  if (view === "monitor") return <Pulse {...props} />;
  if (view === "batch") return <ListBullets {...props} />;
  if (view === "compare") return <ArrowsLeftRight {...props} />;
  if (view === "history") return <ClockCounterClockwise {...props} />;
  return <GearSix {...props} />;
}

export default function ViewSelector({ views, value, onChange }: ViewSelectorProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const active = views.find((view) => view.key === value) ?? views[0];

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div className="space-y-1">
      <div ref={rootRef} className="relative lg:hidden">
        <button
          type="button"
          aria-haspopup="listbox"
          aria-expanded={open}
          onClick={() => setOpen((prev) => !prev)}
          className="flex w-full items-center gap-3 border border-[var(--line)] bg-white px-3 py-2 text-left transition hover:bg-[var(--surface-muted)]"
        >
          <span className="flex h-7 w-7 items-center justify-center border border-slate-900 bg-slate-900 text-white">
            <ViewIcon view={active.key} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-medium text-slate-900">{active.label}</span>
            <span className="block truncate text-[11px] text-slate-500">{active.hint}</span>
          </span>
          <CaretDown
            size={14}
            weight="bold"
            className={`shrink-0 text-slate-500 transition ${open ? "rotate-180" : ""}`}
          />
        </button>

        {open ? (
          <ul
            role="listbox"
            className="absolute z-30 mt-1 max-h-72 w-full overflow-auto border border-[var(--line)] bg-white p-1"
          >
            {views.map((view) => {
              const selected = view.key === value;
              return (
                <li key={view.key} role="option" aria-selected={selected}>
                  <button
                    type="button"
                    onClick={() => {
                      onChange(view.key);
                      setOpen(false);
                    }}
                    className={`flex w-full items-center gap-2.5 px-2 py-2 text-left transition ${
                      selected ? "bg-slate-900 text-white" : "text-slate-700 hover:bg-[var(--surface-muted)]"
                    }`}
                  >
                    <span
                      className={`flex h-7 w-7 items-center justify-center border ${
                        selected ? "border-white/30 bg-white/10 text-white" : "border-[var(--line)] bg-white text-slate-700"
                      }`}
                    >
                      <ViewIcon view={view.key} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">{view.label}</span>
                      <span className={`block truncate text-[11px] ${selected ? "text-slate-300" : "text-slate-500"}`}>
                        {view.hint}
                      </span>
                    </span>
                    {selected ? <Check size={14} weight="bold" className="shrink-0" /> : null}
                  </button>
                </li>
              );
            })}
          </ul>
        ) : null}
      </div>

      <div className="hidden border border-[var(--line)] bg-white lg:block" role="listbox" aria-label="Workspace views">
        {views.map((view, index) => {
          const selected = view.key === value;
          return (
            <button
              key={view.key}
              type="button"
              role="option"
              aria-selected={selected}
              onClick={() => onChange(view.key)}
              className={`flex w-full items-center gap-2.5 px-2.5 py-2 text-left transition ${
                index > 0 ? "border-t border-[var(--line)]" : ""
              } ${selected ? "bg-[#e8e8e8] text-slate-900" : "text-slate-700 hover:bg-[var(--surface-muted)]"}`}
            >
              <span
                className={`flex h-7 w-7 items-center justify-center border ${
                  selected ? "border-slate-900 bg-slate-900 text-white" : "border-[var(--line)] bg-white text-slate-700"
                }`}
              >
                <ViewIcon view={view.key} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium">{view.label}</span>
                <span className="block truncate text-[11px] text-slate-500">{view.hint}</span>
              </span>
              {selected ? <Check size={14} weight="bold" className="shrink-0 text-slate-700" /> : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}
