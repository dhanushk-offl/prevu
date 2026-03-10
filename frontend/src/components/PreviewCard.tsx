export type MetaData = {
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  ogUrl?: string;
  ogSiteName?: string;
  twitterCard?: string;
  twitterTitle?: string;
  twitterDescription?: string;
  twitterImage?: string;
  rawTags: Record<string, string>;
};

type PreviewCardProps = {
  platform: "Twitter" | "LinkedIn" | "Discord" | "WhatsApp" | "Facebook";
  meta: MetaData;
  domain: string;
};

const platformBadge: Record<PreviewCardProps["platform"], string> = {
  Twitter: "bg-sky-50 text-sky-700 border-sky-100",
  LinkedIn: "bg-blue-50 text-blue-700 border-blue-100",
  Discord: "bg-indigo-50 text-indigo-700 border-indigo-100",
  WhatsApp: "bg-emerald-50 text-emerald-700 border-emerald-100",
  Facebook: "bg-slate-100 text-slate-700 border-slate-200",
};

export default function PreviewCard({ platform, meta, domain }: PreviewCardProps) {
  const title = meta.ogTitle || meta.twitterTitle || "Untitled page";
  const description = meta.ogDescription || meta.twitterDescription || "No description found.";
  const image = meta.ogImage || meta.twitterImage;

  return (
    <article className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-[0_6px_20px_rgba(15,23,42,0.08)]">
      <div className="flex items-center justify-between border-b border-slate-100 px-3 py-2">
        <span className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide ${platformBadge[platform]}`}>
          {platform}
        </span>
        <span className="max-w-[150px] truncate text-[10px] font-medium uppercase tracking-wide text-slate-400" title={domain}>
          {domain}
        </span>
      </div>

      {image ? (
        <img src={image} alt={title} className="h-40 w-full object-cover" />
      ) : (
        <div className="flex h-40 items-center justify-center bg-slate-100 text-xs text-slate-500">
          No preview image
        </div>
      )}

      <div className="space-y-1.5 p-3">
        <p className="line-clamp-1 text-[13px] font-semibold text-slate-900">{title}</p>
        <p className="line-clamp-2 text-xs leading-5 text-slate-600">{description}</p>
      </div>
    </article>
  );
}
