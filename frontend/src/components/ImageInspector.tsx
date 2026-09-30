export type ImageInfo = {
  url: string;
  width: number;
  height: number;
  fileSizeBytes: number;
  aspectRatio: number;
  format?: string;
};

type ImageInspectorProps = {
  imageInfo?: ImageInfo;
};

function toKb(size: number) {
  if (size >= 1024 * 1024) return `${(size / (1024 * 1024)).toFixed(2)} MB`;
  return `${(size / 1024).toFixed(1)} KB`;
}

function formatFromUrl(url: string) {
  try {
    const path = new URL(url).pathname.toLowerCase();
    if (path.endsWith(".png")) return "PNG";
    if (path.endsWith(".jpg") || path.endsWith(".jpeg")) return "JPEG";
    if (path.endsWith(".webp")) return "WebP";
    if (path.endsWith(".gif")) return "GIF";
    if (path.endsWith(".svg")) return "SVG";
  } catch {
    // ignore
  }
  return "Unknown";
}

export default function ImageInspector({ imageInfo }: ImageInspectorProps) {
  if (!imageInfo) {
    return <div className="panel p-5 text-sm text-slate-500">No image information available.</div>;
  }

  const format = imageInfo.format || formatFromUrl(imageInfo.url);

  return (
    <div className="panel grid gap-0 lg:grid-cols-[minmax(280px,58%)_minmax(220px,42%)]">
      <div className="flex items-center justify-center border-b border-[var(--line)] bg-[var(--surface-soft)] p-3 lg:border-b-0 lg:border-r">
        <img src={imageInfo.url} alt="OG Preview" className="max-h-[360px] w-full object-contain" />
      </div>
      <div className="grid gap-0 text-sm text-slate-700 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
        <Info label="URL" value={imageInfo.url} breakAll className="sm:col-span-2 xl:col-span-2" />
        <Info label="Dimensions" value={`${imageInfo.width} × ${imageInfo.height} px`} />
        <Info
          label="File size"
          value={`${toKb(imageInfo.fileSizeBytes)} (${imageInfo.fileSizeBytes.toLocaleString()} bytes)`}
        />
        <Info label="Format" value={format} />
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
    <div className={`border-b border-[var(--line)] bg-white px-3 py-2 ${className}`}>
      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className={`mt-1 text-xs text-slate-800 ${breakAll ? "break-all" : ""}`}>{value}</p>
    </div>
  );
}
