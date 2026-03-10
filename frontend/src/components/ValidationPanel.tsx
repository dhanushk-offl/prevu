type ValidationPanelProps = {
  passed: string[];
  warnings: string[];
};

function List({ items, empty, tone }: { items: string[]; empty: string; tone: "ok" | "warn" }) {
  const styles =
    tone === "ok"
      ? "border-emerald-200 bg-emerald-50/80 text-emerald-900"
      : "border-amber-200 bg-amber-50/80 text-amber-900";

  return (
    <section className={`rounded-xl border p-4 ${styles}`}>
      {items.length === 0 ? <p className="text-xs">{empty}</p> : null}
      <ul className="space-y-2 text-xs leading-5">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </section>
  );
}

export default function ValidationPanel({ passed, warnings }: ValidationPanelProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div>
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-emerald-700">Passed checks</h3>
        <List items={passed} empty="No passing checks yet." tone="ok" />
      </div>
      <div>
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-amber-700">Warnings</h3>
        <List items={warnings} empty="No warnings." tone="warn" />
      </div>
    </div>
  );
}
