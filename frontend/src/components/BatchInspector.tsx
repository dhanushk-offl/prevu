export type BatchInspectRow = {
  url: string;
  title?: string;
  ogImagePresent: boolean;
  status: string;
  imageUrl?: string;
  error?: string;
};

type BatchInspectorProps = {
  value: string;
  loading: boolean;
  rows: BatchInspectRow[];
  onChange: (value: string) => void;
  onInspect: () => void;
};

export default function BatchInspector({ value, loading, rows, onChange, onInspect }: BatchInspectorProps) {
  return (
    <section className="panel p-5">
      <div className="panel-head">
        <div>
          <h2 className="panel-title">Multi-URL Batch Inspector</h2>
          <p className="panel-subtitle">Inspect many URLs in one pass and verify OG image coverage.</p>
        </div>
        <button onClick={onInspect} disabled={loading} className="btn-primary">
          {loading ? "Inspecting" : "Run Batch"}
        </button>
      </div>

      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="https://site.com/blog/1&#10;https://site.com/blog/2&#10;https://site.com/blog/3"
        className="input-shell mb-4 h-28 w-full resize-y font-mono text-xs leading-5"
      />

      {rows.length > 0 ? (
        <div className="overflow-auto rounded-xl border border-slate-200">
          <table className="min-w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="px-3 py-2">URL</th>
                <th className="px-3 py-2">OG Image</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Image</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, idx) => (
                <tr key={row.url + idx} className="border-t border-slate-100 align-top">
                  <td className="max-w-[300px] px-3 py-2 text-slate-700">
                    <p className="truncate font-medium" title={row.url}>{row.url}</p>
                    {row.title ? <p className="mt-1 text-[11px] text-slate-500">{row.title}</p> : null}
                    {row.error ? <p className="mt-1 text-[11px] text-rose-600">{row.error}</p> : null}
                  </td>
                  <td className="px-3 py-2">{row.ogImagePresent ? "Yes" : "No"}</td>
                  <td className="px-3 py-2">{row.status}</td>
                  <td className="px-3 py-2">
                    {row.imageUrl ? (
                      <img src={row.imageUrl} alt="OG" className="h-12 w-20 rounded-lg border border-slate-200 object-cover" />
                    ) : (
                      <span className="text-slate-400">-</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-xs text-slate-500">Run batch inspection to populate the table.</p>
      )}
    </section>
  );
}
