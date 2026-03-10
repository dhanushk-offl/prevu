export type CompareDiff = {
  field: string;
  staging?: string;
  production?: string;
};

export type CompareResult = {
  differences: CompareDiff[];
};

type ComparePanelProps = {
  stagingUrl: string;
  productionUrl: string;
  loading: boolean;
  result?: CompareResult;
  onStagingChange: (value: string) => void;
  onProductionChange: (value: string) => void;
  onCompare: () => void;
};

export default function ComparePanel({
  stagingUrl,
  productionUrl,
  loading,
  result,
  onStagingChange,
  onProductionChange,
  onCompare,
}: ComparePanelProps) {
  return (
    <section className="panel p-5">
      <div className="panel-head">
        <div>
          <h2 className="panel-title">Staging vs Production Compare</h2>
          <p className="panel-subtitle">Detect metadata changes before deployment.</p>
        </div>
        <button onClick={onCompare} disabled={loading} className="btn-primary">
          {loading ? "Comparing" : "Compare"}
        </button>
      </div>

      <div className="mb-4 grid gap-3 md:grid-cols-2">
        <input
          value={stagingUrl}
          onChange={(e) => onStagingChange(e.target.value)}
          placeholder="https://staging.example.com"
          className="input-shell"
        />
        <input
          value={productionUrl}
          onChange={(e) => onProductionChange(e.target.value)}
          placeholder="https://example.com"
          className="input-shell"
        />
      </div>

      {result ? (
        result.differences.length > 0 ? (
          <div className="space-y-2">
            {result.differences.map((diff) => (
              <div key={diff.field} className="rounded-xl border border-amber-200 bg-amber-50/90 p-3 text-xs">
                <p className="mb-1 font-semibold text-amber-800">{diff.field} changed</p>
                <p className="text-amber-900"><span className="font-semibold">Staging:</span> {diff.staging || "(missing)"}</p>
                <p className="text-amber-900"><span className="font-semibold">Production:</span> {diff.production || "(missing)"}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-emerald-700">No metadata differences detected.</p>
        )
      ) : (
        <p className="text-xs text-slate-500">Compare URLs to see changed metadata fields.</p>
      )}
    </section>
  );
}
