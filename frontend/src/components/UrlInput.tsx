import { FormEvent } from "react";

type UrlInputProps = {
  url: string;
  loading: boolean;
  onChange: (value: string) => void;
  onInspect: () => void;
};

export default function UrlInput({ url, loading, onChange, onInspect }: UrlInputProps) {
  const submit = (event: FormEvent) => {
    event.preventDefault();
    onInspect();
  };

  return (
    <form className="flex w-full flex-col gap-3 sm:flex-row" onSubmit={submit}>
      <div className="relative flex-1">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">URL</span>
        <input
          value={url}
          onChange={(event) => onChange(event.target.value)}
          placeholder="https://example.com or http://localhost:3000"
          className="input-shell h-11 w-full pl-12"
        />
      </div>
      <button type="submit" disabled={loading} className="btn-primary h-11 min-w-28">
        {loading ? "Inspecting" : "Inspect"}
      </button>
    </form>
  );
}
