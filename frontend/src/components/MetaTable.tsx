type MetaTableProps = {
  tags: Record<string, string>;
};

export default function MetaTable({ tags }: MetaTableProps) {
  const entries = Object.entries(tags).sort(([a], [b]) => a.localeCompare(b));

  if (entries.length === 0) {
    return <div className="panel p-5 text-sm text-slate-500">No metadata tags found.</div>;
  }

  return (
    <div className="panel overflow-auto">
      <table className="min-w-full text-left text-sm">
        <thead className="sticky top-0 bg-slate-50 text-slate-600">
          <tr>
            <th className="px-4 py-3 font-semibold">Tag</th>
            <th className="px-4 py-3 font-semibold">Value</th>
          </tr>
        </thead>
        <tbody>
          {entries.map(([tag, value], idx) => (
            <tr key={tag} className={`align-top ${idx % 2 === 0 ? "bg-white" : "bg-slate-50/40"}`}>
              <td className="whitespace-nowrap border-t border-slate-100 px-4 py-3 font-mono text-xs text-slate-700">{tag}</td>
              <td className="border-t border-slate-100 px-4 py-3 break-all text-slate-800">{value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
