export type ImageInfo = {
  url: string;
  width: number;
  height: number;
  fileSizeBytes: number;
  aspectRatio: number;
};

type ImageInspectorProps = {
  imageInfo?: ImageInfo;
};

function toKb(size: number) {
  return `${(size / 1024).toFixed(1)} KB`;
}

export default function ImageInspector({ imageInfo }: ImageInspectorProps) {
  if (!imageInfo) {
    return <div className="panel p-5 text-sm text-slate-500">No image information available.</div>;
  }

  return (
    <div className="panel grid gap-4 p-4 lg:grid-cols-[minmax(260px,55%)_minmax(220px,45%)]">
      <img src={imageInfo.url} alt="OG Preview" className="h-56 w-full rounded-xl border border-slate-200 object-cover" />
      <div className="grid gap-2 text-sm text-slate-700 sm:grid-cols-2">
        <Info label="URL" value={imageInfo.url} breakAll className="sm:col-span-2" />
        <Info label="Dimensions" value={`${imageInfo.width} x ${imageInfo.height}`} />
        <Info label="File size" value={`${toKb(imageInfo.fileSizeBytes)} (${imageInfo.fileSizeBytes} bytes)`} />
        <Info label="Aspect ratio" value={`${imageInfo.aspectRatio.toFixed(2)}:1`} />
      </div>
    </div>
  );
}

function Info({
  label,
  value,
  breakAll = false,
  className = "",
}: {
  label: string;
  value: string;
  breakAll?: boolean;
  className?: string;
}) {
  return (
    <div className={`rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 ${className}`}>
      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className={`mt-1 text-xs text-slate-800 ${breakAll ? "break-all" : ""}`}>{value}</p>
    </div>
  );
}
