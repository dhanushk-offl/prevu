import { useEffect, useMemo, useRef, useState } from "react";
import {
  FaApple,
  FaChevronLeft,
  FaChevronRight,
  FaGithub,
  FaLinux,
  FaTimes,
  FaWindows,
} from "react-icons/fa";
import {
  CONTRIBUTING,
  DOCS,
  ISSUES,
  REPO,
  RELEASES,
  VERSION,
  docLinks,
  faqs,
  features,
  platforms,
  screenshots,
} from "./content";

const OS_ICONS = {
  windows: FaWindows,
  macos: FaApple,
  linux: FaLinux,
};

function useHashRoute() {
  const [path, setPath] = useState(() => normalizePath(window.location.pathname));

  useEffect(() => {
    const onChange = () => setPath(normalizePath(window.location.pathname));
    window.addEventListener("popstate", onChange);
    return () => window.removeEventListener("popstate", onChange);
  }, []);

  const navigate = (next) => {
    if (normalizePath(next) === path) return;
    window.history.pushState({}, "", next);
    setPath(normalizePath(next));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return { path, navigate, isGuide: path === "/guide" };
}

function normalizePath(value) {
  const cleaned = String(value || "/").replace(/\/+$/, "");
  return cleaned === "" ? "/" : cleaned;
}

const FOCUSABLE_SELECTOR =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

function ScreenshotLightbox({ index, onClose, onPrev, onNext, dimensionsById }) {
  const closeRef = useRef(null);
  const dialogRef = useRef(null);
  const shot = screenshots[index];
  const hasPrev = index > 0;
  const hasNext = index < screenshots.length - 1;
  const dimensions = shot ? dimensionsById?.[shot.id] : null;

  useEffect(() => {
    const previous = document.activeElement;
    closeRef.current?.focus();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const focusable = () =>
      Array.from(dialogRef.current?.querySelectorAll(FOCUSABLE_SELECTOR) ?? []).filter(
        (el) => el.getClientRects().length > 0,
      );

    // Hide the page behind the dialog from the focus order and from AT.
    const inerted = [];
    for (let node = dialogRef.current; node && node !== document.body; node = node.parentElement) {
      const parent = node.parentElement;
      if (!parent) break;
      for (const sibling of parent.children) {
        if (sibling === node || sibling.inert) continue;
        sibling.inert = true;
        inerted.push(sibling);
      }
    }

    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      } else if (event.key === "ArrowLeft") {
        event.preventDefault();
        onPrev();
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        onNext();
      } else if (event.key === "Tab") {
        const items = focusable();
        if (!items.length) {
          event.preventDefault();
          return;
        }
        const first = items[0];
        const last = items[items.length - 1];
        const active = document.activeElement;
        const outside = !dialogRef.current?.contains(active);
        if (event.shiftKey) {
          if (outside || active === first) {
            event.preventDefault();
            last.focus();
          }
        } else if (outside || active === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
      for (const el of inerted) el.inert = false;
      if (previous instanceof HTMLElement) previous.focus();
    };
  }, [index, onClose, onPrev, onNext]);

  if (!shot) return null;

  return (
    <div
      ref={dialogRef}
      className="lightbox"
      role="dialog"
      aria-modal="true"
      aria-label={`${shot.title} screenshot`}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="lightboxPanel">
        <div className="lightboxToolbar">
          <div>
            <p className="lightboxTitle">{shot.title}</p>
            <p className="lightboxCaption">{shot.caption}</p>
          </div>
          <button
            ref={closeRef}
            type="button"
            className="lightboxIconBtn"
            onClick={onClose}
            aria-label="Close screenshot"
          >
            <FaTimes aria-hidden="true" />
          </button>
        </div>

        <div className="lightboxStage">
          <button
            type="button"
            className="lightboxNav lightboxNavPrev"
            onClick={onPrev}
            disabled={!hasPrev}
            aria-label="Previous screenshot"
          >
            <FaChevronLeft aria-hidden="true" />
          </button>

          <img src={shot.src} alt={shot.caption} />

          <button
            type="button"
            className="lightboxNav lightboxNavNext"
            onClick={onNext}
            disabled={!hasNext}
            aria-label="Next screenshot"
          >
            <FaChevronRight aria-hidden="true" />
          </button>
        </div>

        <p className="lightboxMeta">
          {index + 1} / {screenshots.length}
          {dimensions ? <span>{dimensions}</span> : null}
          <span>Use ← → or the arrows · Esc to close</span>
        </p>
      </div>
    </div>
  );
}

function Nav({ starLabel, version, path, navigate }) {
  return (
    <header className="topbar">
      <a
        className="brand"
        href="/"
        onClick={(event) => {
          event.preventDefault();
          navigate("/");
        }}
      >
        <img src="/logo.png" alt="" width={28} height={28} />
        <span className="brandName">PREVU</span>
        <span className="versionPill" title="Synced from root package.json">
          v{version}
        </span>
      </a>

      <nav className="navLinks" aria-label="Primary">
        <a href="/#features" className={path === "/" ? undefined : "muted"}>
          Features
        </a>
        <a href="/#screenshots">Screenshots</a>
        <a href="/#downloads">Download</a>
        <a
          href="/guide"
          className={path === "/guide" ? "active" : undefined}
          onClick={(event) => {
            event.preventDefault();
            navigate("/guide");
          }}
        >
          Guide
        </a>
        <a href="/#docs">Docs</a>
        <a className="starBtn" href={REPO} target="_blank" rel="noreferrer">
          <FaGithub aria-hidden="true" />
          <span>{starLabel}</span>
        </a>
      </nav>
    </header>
  );
}

function HomePage({ releaseTag, releaseLoading, findByExt, version, navigate }) {
  const displayVersion = releaseTag || `v${version}`;
  const [lightboxIndex, setLightboxIndex] = useState(null);
  const [shotDimensions, setShotDimensions] = useState({});

  const registerShotDimensions = (id, event) => {
    const { naturalWidth, naturalHeight } = event.currentTarget;
    if (!naturalWidth || !naturalHeight) return;
    const label = `${naturalWidth} × ${naturalHeight}`;
    setShotDimensions((current) => {
      if (current[id] === label) return current;
      return { ...current, [id]: label };
    });
  };

  const openShot = (shotId) => {
    const index = screenshots.findIndex((shot) => shot.id === shotId);
    if (index >= 0) setLightboxIndex(index);
  };

  const closeLightbox = () => setLightboxIndex(null);
  const showPrev = () => setLightboxIndex((current) => (current == null ? current : Math.max(0, current - 1)));
  const showNext = () =>
    setLightboxIndex((current) =>
      current == null ? current : Math.min(screenshots.length - 1, current + 1),
    );

  return (
    <>
      <section className="hero">
        <div className="heroCopy fadeUp">
          <p className="brandMark">PREVU</p>
          <h1>Catch broken social previews before you ship.</h1>
          <p className="subhead">
            Inspect Open Graph and Twitter Card metadata on localhost, staging, or production — with validation,
            platform previews, and a shared Rust CLI.
          </p>
          <div className="actions">
            <a className="btn primary" href="#downloads">
              Download {displayVersion}
            </a>
            <a className="btn ghost" href={REPO} target="_blank" rel="noreferrer">
              GitHub
            </a>
          </div>
          <p className="heroMeta">Windows · macOS · Linux · MIT · v{version}</p>
        </div>
      </section>

      <section id="screenshots" className="section">
        <div className="sectionHead">
          <h2>Product screenshots</h2>
          <p className="sectionText">
            Tap any image to open a larger view. Dimensions are shown per screenshot for quick clarity.
          </p>
        </div>
        <div className="shotGrid">
          {screenshots.map((shot) => (
            <button
              key={shot.id}
              type="button"
              className="shotThumb"
              onClick={() => openShot(shot.id)}
              aria-label={`View ${shot.title} larger`}
            >
              <img
                src={shot.src}
                alt=""
                loading="lazy"
                onLoad={(event) => registerShotDimensions(shot.id, event)}
              />
              <span className="shotMeta">
                <strong>{shot.title}</strong>
                <small>{shotDimensions[shot.id] || "Loading size..."}</small>
              </span>
            </button>
          ))}
        </div>
      </section>

      {lightboxIndex != null ? (
        <ScreenshotLightbox
          index={lightboxIndex}
          onClose={closeLightbox}
          onPrev={showPrev}
          onNext={showNext}
          dimensionsById={shotDimensions}
        />
      ) : null}

      <section id="features" className="section">
        <div className="sectionHead">
          <h2>Built for local-first metadata work</h2>
          <p className="sectionText">Everything you need between “paste a URL” and “ship with confidence.”</p>
        </div>
        <div className="featureGrid">
          {features.map((feature) => (
            <article key={feature.title} className="featureItem">
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="downloads" className="section">
        <div className="sectionHead">
          <h2>Download</h2>
          <p className="sectionText">
            Latest packaged release{releaseTag ? ` (${releaseTag})` : ` (app v${version})`}. Builds are currently
            unsigned — see the guide if Gatekeeper or SmartScreen prompts appear.
          </p>
        </div>
        <div className="downloadGrid">
          {platforms.map((platform) => {
            const Icon = OS_ICONS[platform.id];
            return (
              <article key={platform.id} className="downloadItem">
                <div className="osHead">
                  <span className="osIcon" aria-hidden="true">
                    <Icon />
                  </span>
                  <div>
                    <h3>{platform.name}</h3>
                    <p>{platform.detail}</p>
                  </div>
                </div>
                {platform.note ? (
                  <p className="downloadNote">
                    Arch: <code>{platform.note}</code>
                  </p>
                ) : null}
                <div className="assetRow">
                  {platform.exts.map((ext) => (
                    <AssetButton
                      key={ext}
                      loading={releaseLoading}
                      label={extLabel(ext)}
                      assets={findByExt(ext)}
                    />
                  ))}
                </div>
              </article>
            );
          })}
        </div>
        <p className="releaseHint">
          Prefer browsing every asset? Open{" "}
          <a href={RELEASES} target="_blank" rel="noreferrer">
            GitHub Releases
          </a>
          . Stuck installing? Read the{" "}
          <a
            href="/guide"
            onClick={(event) => {
              event.preventDefault();
              navigate("/guide");
            }}
          >
            installation guide
          </a>{" "}
          or{" "}
          <a href={ISSUES} target="_blank" rel="noreferrer">
            file an issue
          </a>
          .
        </p>
      </section>

      <section id="docs" className="section docsSection">
        <div className="sectionHead">
          <h2>Developer docs</h2>
          <p className="sectionText">
            Version <strong>v{version}</strong> is read from the monorepo root <code>package.json</code> at build
            time — bump it once and the site stays aligned.
          </p>
        </div>
        <div className="docGrid">
          {docLinks.map((link) => (
            <a key={link.label} className="docLink" href={link.href} target="_blank" rel="noreferrer">
              <span>{link.label}</span>
              <span aria-hidden="true">↗</span>
            </a>
          ))}
        </div>
        <pre className="devSnippet">
          <code>{`bun install
bun run tauri:dev
bun run cli -- inspect http://localhost:3000`}</code>
        </pre>
        <p className="sectionText">
          Full contributor workflow:{" "}
          <a href={CONTRIBUTING} target="_blank" rel="noreferrer">
            CONTRIBUTING.md
          </a>{" "}
          · docs index:{" "}
          <a href={DOCS} target="_blank" rel="noreferrer">
            /docs
          </a>
        </p>
      </section>

      <section id="faq" className="section">
        <div className="sectionHead">
          <h2>FAQ</h2>
        </div>
        <div className="faqList">
          {faqs.map((item) => (
            <details key={item.q}>
              <summary>{item.q}</summary>
              <p>{item.a}</p>
            </details>
          ))}
        </div>
      </section>
    </>
  );
}

function GuidePage({ navigate }) {
  return (
    <section className="guidePage fadeUp">
      <p className="eyebrow">Install</p>
      <h1>Installation guide</h1>
      <p className="guideLead">
        Pick the package for your OS. PREVU builds are unsigned today, so first-launch security prompts are expected
        on some systems.
      </p>

      <article className="guideBlock">
        <h2>Before you install</h2>
        <ul>
          <li>
            Download installers from{" "}
            <a href={RELEASES} target="_blank" rel="noreferrer">
              GitHub Releases
            </a>
            .
          </li>
          <li>
            <strong>Windows EXE</strong> for typical installs; <strong>MSI</strong> for managed deployments.
          </li>
          <li>
            <strong>macOS DMG</strong> for drag-and-drop into Applications.
          </li>
          <li>
            <strong>Linux AppImage</strong> for portable runs; <strong>.deb</strong> for Debian/Ubuntu; AUR package{" "}
            <code>prevu</code> on Arch.
          </li>
        </ul>
      </article>

      <div className="guideGrid">
        <article className="guideBlock">
          <h2>Windows</h2>
          <ol>
            <li>Download the EXE (or MSI) from Releases.</li>
            <li>Run the installer.</li>
            <li>
              If SmartScreen appears: <strong>More info → Run anyway</strong>.
            </li>
            <li>Launch PREVU from the Start Menu.</li>
          </ol>
        </article>

        <article className="guideBlock">
          <h2>macOS</h2>
          <ol>
            <li>Download the DMG for your architecture.</li>
            <li>Drag PREVU into Applications.</li>
            <li>
              If blocked, use <strong>Privacy &amp; Security → Open Anyway</strong>, or:
            </li>
          </ol>
          <pre>
            <code>xattr -cr /Applications/PREVU.app</code>
          </pre>
        </article>

        <article className="guideBlock">
          <h2>Linux</h2>
          <p className="guideNote">Arch (AUR)</p>
          <pre>
            <code>yay -S prevu</code>
          </pre>
          <p className="guideNote">AppImage</p>
          <pre>
            <code>{`chmod +x PREVU_*_amd64.AppImage
./PREVU_*_amd64.AppImage`}</code>
          </pre>
          <p className="guideNote">Debian / Ubuntu</p>
          <pre>
            <code>{`sudo dpkg -i PREVU_*_amd64.deb
sudo apt-get install -f`}</code>
          </pre>
        </article>
      </div>

      <article className="guideBlock">
        <h2>Common issues</h2>
        <ul>
          <li>
            <strong>Windows SmartScreen</strong> — unsigned binary; use More info → Run anyway.
          </li>
          <li>
            <strong>macOS Gatekeeper</strong> — Open Anyway, or <code>xattr -cr</code> as above.
          </li>
          <li>
            <strong>Linux AppImage</strong> — ensure the file is executable (<code>chmod +x</code>).
          </li>
          <li>
            <strong>WebKitGTK</strong> — install <code>libwebkit2gtk-4.1-0</code> (or distro equivalent) if the UI
            fails to open.
          </li>
        </ul>
      </article>

      <article className="guideBlock issueCard">
        <h2>Still stuck?</h2>
        <p>
          Open an issue with OS, installer type, PREVU version, and the exact error:{" "}
          <a href={ISSUES} target="_blank" rel="noreferrer">
            {ISSUES.replace("https://", "")}
          </a>
          .
        </p>
        <button type="button" className="btn ghost" onClick={() => navigate("/")}>
          ← Back to home
        </button>
      </article>
    </section>
  );
}

// Tauri's default bundle names encode the Rust target, so the same extension can
// ship more than one build (e.g. aarch64 + x64 DMGs). Distinguish them in the UI.
function assetVariant(asset) {
  const name = String(asset?.name || "").toLowerCase();
  if (name.includes("aarch64") || name.includes("arm64")) return "arm64";
  if (name.includes("x86_64") || name.includes("x64")) return "x64";
  return null;
}

function AssetButton({ loading, label, assets }) {
  if (loading) {
    return (
      <button className="assetBtn" type="button" disabled>
        Loading {label}
      </button>
    );
  }
  if (!assets.length) {
    return (
      <button className="assetBtn" type="button" disabled>
        {label} unavailable
      </button>
    );
  }
  return assets.map((asset, i) => {
    const variant = assetVariant(asset);
    const text = assets.length > 1 ? `${label} · ${variant || asset.name}` : label;
    return (
      <a
        key={`${asset.name || "asset"}-${i}`}
        className="assetBtn"
        href={asset.browser_download_url || RELEASES}
        target="_blank"
        rel="noreferrer"
        title={asset.name}
      >
        {text}
      </a>
    );
  });
}

function extLabel(ext) {
  if (ext === ".appimage") return "AppImage";
  return ext.replace(".", "").toUpperCase();
}

export default function App() {
  const { path, navigate, isGuide } = useHashRoute();
  const [stars, setStars] = useState(null);
  const [starsLoading, setStarsLoading] = useState(true);
  const [releaseAssets, setReleaseAssets] = useState([]);
  const [releaseTag, setReleaseTag] = useState("");
  const [releaseLoading, setReleaseLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const loadStars = async () => {
      try {
        const res = await fetch(`${REPO.replace("https://github.com", "https://api.github.com/repos")}`, {
          headers: { Accept: "application/vnd.github+json" },
        });
        if (!res.ok) return;
        const data = await res.json();
        if (mounted && typeof data.stargazers_count === "number") setStars(data.stargazers_count);
      } catch {
        // ignore network errors
      } finally {
        if (mounted) setStarsLoading(false);
      }
    };
    loadStars();
    const timer = setInterval(loadStars, 60_000);
    return () => {
      mounted = false;
      clearInterval(timer);
    };
  }, []);

  useEffect(() => {
    let mounted = true;
    const loadLatestRelease = async () => {
      try {
        const res = await fetch("https://api.github.com/repos/dhanushk-offl/prevu/releases/latest", {
          headers: { Accept: "application/vnd.github+json" },
        });
        if (!res.ok) return;
        const data = await res.json();
        if (mounted) {
          setReleaseAssets(Array.isArray(data.assets) ? data.assets : []);
          setReleaseTag(typeof data.tag_name === "string" ? data.tag_name : "");
        }
      } catch {
        // ignore
      } finally {
        if (mounted) setReleaseLoading(false);
      }
    };
    loadLatestRelease();
    return () => {
      mounted = false;
    };
  }, []);

  const starLabel = useMemo(() => {
    if (starsLoading) return "GitHub";
    if (typeof stars !== "number") return "Star on GitHub";
    return `${stars.toLocaleString()} stars`;
  }, [stars, starsLoading]);

  const findByExt = useMemo(
    () => (ext) => releaseAssets.filter((asset) => String(asset.name || "").toLowerCase().endsWith(ext)),
    [releaseAssets],
  );

  return (
    <div className="page">
      <Nav starLabel={starLabel} version={VERSION} path={path} navigate={navigate} />
      <main>
        {isGuide ? (
          <GuidePage navigate={navigate} />
        ) : (
          <HomePage
            releaseTag={releaseTag}
            releaseLoading={releaseLoading}
            findByExt={findByExt}
            version={VERSION}
            navigate={navigate}
          />
        )}
      </main>
      <footer className="siteFooter">
        <div>
          <strong>PREVU</strong> · v{VERSION} · MIT © Prevu Contributors
        </div>
        <div className="footerLinks">
          <a href={REPO} target="_blank" rel="noreferrer">
            GitHub
          </a>
          <a href={RELEASES} target="_blank" rel="noreferrer">
            Releases
          </a>
          <a href={ISSUES} target="_blank" rel="noreferrer">
            Issues
          </a>
          <a href="https://buymeacoffee.com/itzmedhanu" target="_blank" rel="noreferrer">
            Support
          </a>
          <a href="https://www.producthunt.com/products/prevu-2" target="_blank" rel="noreferrer">
            Product Hunt
          </a>
        </div>
      </footer>
    </div>
  );
}
