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

export type PreviewPlatform =
  | "Twitter"
  | "LinkedIn"
  | "Discord"
  | "WhatsApp"
  | "Facebook"
  | "Slack";

type PreviewCardProps = {
  platform: PreviewPlatform;
  meta: MetaData;
  domain: string;
};

function PreviewImage({
  src,
  alt,
  className = "",
  maxHeightClass = "max-h-52",
}: {
  src: string;
  alt: string;
  className?: string;
  maxHeightClass?: string;
}) {
  return (
    <div className={`flex w-full items-center justify-center bg-[var(--surface-muted)] ${className}`}>
      <img
        src={src}
        alt={alt}
        className={`h-auto w-full ${maxHeightClass} object-contain`}
        loading="lazy"
        decoding="async"
      />
    </div>
  );
}

export default function PreviewCard({ platform, meta, domain }: PreviewCardProps) {
  const title = meta.ogTitle || meta.twitterTitle || "Untitled page";
  const description = meta.ogDescription || meta.twitterDescription || "No description found.";
  const image = meta.ogImage || meta.twitterImage;
  const site = meta.ogSiteName || domain;

  return (
    <div className="space-y-1.5">
      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">{platform}</p>
      {platform === "Twitter" ? (
        <TwitterPreview title={title} description={description} image={image} domain={domain} />
      ) : null}
      {platform === "LinkedIn" ? (
        <LinkedInPreview title={title} description={description} image={image} domain={domain} />
      ) : null}
      {platform === "Facebook" ? (
        <FacebookPreview title={title} description={description} image={image} domain={domain} />
      ) : null}
      {platform === "Discord" ? (
        <DiscordPreview title={title} description={description} image={image} site={site} />
      ) : null}
      {platform === "WhatsApp" ? (
        <WhatsAppPreview title={title} description={description} image={image} domain={domain} />
      ) : null}
      {platform === "Slack" ? (
        <SlackPreview title={title} description={description} image={image} site={site} />
      ) : null}
    </div>
  );
}

function TwitterPreview({
  title,
  description,
  image,
  domain,
}: {
  title: string;
  description: string;
  image?: string;
  domain: string;
}) {
  return (
    <article className="overflow-hidden border border-slate-300 bg-white">
      {image ? (
        <PreviewImage src={image} alt={title} className="border-b border-slate-300" maxHeightClass="max-h-56" />
      ) : (
        <EmptyImage className="h-40" />
      )}
      <div className="space-y-0.5 px-3 py-2.5">
        <p className="truncate text-[13px] font-bold leading-5 text-slate-900">{title}</p>
        <p className="line-clamp-2 text-[13px] leading-4 text-slate-500">{description}</p>
        <p className="truncate pt-0.5 text-[13px] text-slate-500">{domain}</p>
      </div>
    </article>
  );
}

function LinkedInPreview({
  title,
  description,
  image,
  domain,
}: {
  title: string;
  description: string;
  image?: string;
  domain: string;
}) {
  return (
    <article className="overflow-hidden border border-[var(--line)] bg-white">
      {image ? (
        <PreviewImage src={image} alt={title} className="border-b border-[var(--line)]" maxHeightClass="max-h-52" />
      ) : (
        <EmptyImage className="h-36" />
      )}
      <div className="space-y-1 px-3 py-2.5">
        <p className="line-clamp-2 text-sm font-semibold text-slate-900">{title}</p>
        <p className="line-clamp-2 text-xs text-slate-500">{description}</p>
        <p className="truncate text-[12px] text-slate-500">{domain}</p>
      </div>
    </article>
  );
}

function FacebookPreview({
  title,
  description,
  image,
  domain,
}: {
  title: string;
  description: string;
  image?: string;
  domain: string;
}) {
  return (
    <article className="overflow-hidden border border-slate-300 bg-[var(--surface-muted)]">
      {image ? (
        <PreviewImage src={image} alt={title} className="bg-white" maxHeightClass="max-h-52" />
      ) : (
        <EmptyImage className="h-36 bg-white" />
      )}
      <div className="space-y-0.5 px-3 py-2.5">
        <p className="truncate text-[11px] uppercase tracking-wide text-slate-500">{domain}</p>
        <p className="line-clamp-2 text-[16px] font-semibold leading-5 text-slate-900">{title}</p>
        <p className="line-clamp-1 text-[14px] text-slate-500">{description}</p>
      </div>
    </article>
  );
}

function DiscordPreview({
  title,
  description,
  image,
  site,
}: {
  title: string;
  description: string;
  image?: string;
  site: string;
}) {
  return (
    <article className="flex overflow-hidden border border-[#1e1f22]" style={{ backgroundColor: "#2b2d31" }}>
      <div className="w-1 shrink-0" style={{ backgroundColor: "#1abc9c" }} />
      <div className="min-w-0 flex-1 space-y-2 p-3">
        <p className="truncate text-xs font-semibold" style={{ color: "#00a8fc" }}>
          {site}
        </p>
        <p className="line-clamp-2 text-sm font-semibold" style={{ color: "#00a8fc" }}>
          {title}
        </p>
        <p className="line-clamp-3 text-xs leading-5" style={{ color: "#dbdee1" }}>
          {description}
        </p>
        {image ? (
          <div className="overflow-hidden border border-[#1e1f22]">
            <PreviewImage src={image} alt={title} className="bg-slate-900" maxHeightClass="max-h-48" />
          </div>
        ) : (
          <EmptyImage className="h-28 bg-slate-900 text-slate-400" />
        )}
      </div>
    </article>
  );
}

function WhatsAppPreview({
  title,
  description,
  image,
  domain,
}: {
  title: string;
  description: string;
  image?: string;
  domain: string;
}) {
  return (
    <div className="border border-[#d1c7b7] p-3" style={{ backgroundColor: "#e5ddd5" }}>
      <article className="overflow-hidden border border-[#c8e6b8]" style={{ backgroundColor: "#dcf8c6" }}>
        <div className="flex bg-white/80">
          {image ? (
            <div className="shrink-0 self-stretch border-r border-[var(--line)] bg-slate-100" style={{ width: 88 }}>
              <img src={image} alt={title} className="h-full min-h-[88px] w-full object-contain" />
            </div>
          ) : (
            <div
              className="flex shrink-0 items-center justify-center border-r border-[var(--line)] bg-slate-200 text-[10px] text-slate-500"
              style={{ width: 88 }}
            >
              No image
            </div>
          )}
          <div className="min-w-0 flex-1 space-y-0.5 px-2.5 py-2">
            <p className="line-clamp-2 text-[13px] font-semibold text-slate-900">{title}</p>
            <p className="line-clamp-2 text-[12px] text-slate-500">{description}</p>
            <p className="truncate text-[11px] uppercase text-slate-500">{domain}</p>
          </div>
        </div>
      </article>
    </div>
  );
}

function SlackPreview({
  title,
  description,
  image,
  site,
}: {
  title: string;
  description: string;
  image?: string;
  site: string;
}) {
  return (
    <article className="flex overflow-hidden border border-[var(--line)] bg-white">
      <div className="w-1 shrink-0" style={{ backgroundColor: "#e01e5a" }} />
      <div className="min-w-0 flex-1 space-y-1.5 p-3">
        <p className="truncate text-xs font-bold text-slate-900">{site}</p>
        <p className="line-clamp-2 text-sm font-semibold" style={{ color: "#1264a3" }}>
          {title}
        </p>
        <p className="line-clamp-3 text-xs leading-5 text-slate-800">{description}</p>
        {image ? (
          <div className="overflow-hidden border border-[var(--line)]">
            <PreviewImage src={image} alt={title} maxHeightClass="max-h-44" />
          </div>
        ) : (
          <EmptyImage className="h-28" />
        )}
      </div>
    </article>
  );
}

function EmptyImage({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center justify-center bg-[var(--surface-muted)] text-xs text-slate-500 ${className}`}>
      No preview image
    </div>
  );
}
