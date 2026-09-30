/**
 * Marketing-site content.
 * Version is injected at build time from the repo root package.json
 * (see vite.config.js → __PREVU_VERSION__). Keep screenshots / copy
 * aligned with the root README.
 */

export const VERSION = typeof __PREVU_VERSION__ !== "undefined" ? __PREVU_VERSION__ : "0.0.0";

export const REPO = "https://github.com/dhanushk-offl/prevu";
export const RELEASES = `${REPO}/releases`;
export const ISSUES = `${REPO}/issues`;
export const DOCS = `${REPO}/tree/master/docs`;
export const CONTRIBUTING = `${REPO}/blob/master/CONTRIBUTING.md`;

export const screenshots = [
  {
    id: "home",
    title: "Home",
    caption: "Inspect a URL and preview how it renders across social platforms.",
    src: "https://www.podu.pics/4N_-H50wW5",
  },
  {
    id: "monitor",
    title: "Site scan",
    caption: "Progressive site monitoring in batches of 10 — built for large sitemaps.",
    src: "https://www.podu.pics/kBh8sQ4HAX",
  },
  {
    id: "batch",
    title: "Batch testing",
    caption: "Inspect many URLs at once and spot missing OG images fast.",
    src: "https://www.podu.pics/JFC1UZvStF",
  },
  {
    id: "compare",
    title: "Staging vs production",
    caption: "Diff metadata between local, staging, and production environments.",
    src: "https://www.podu.pics/HnmG9n2t6C",
  },
  {
    id: "local",
    title: "Local URL / port",
    caption: "Paste localhost or any port — no public URL or deploy required.",
    src: "https://www.podu.pics/IpVQNDVQ_k",
  },
];

export const features = [
  {
    title: "Inspect any URL",
    description: "localhost, staging, or production — same workflow on your machine.",
  },
  {
    title: "Open Graph & Twitter",
    description: "Extract tags at a glance with structured meta tables.",
  },
  {
    title: "Validation",
    description: "Required tags, image dimensions, aspect ratio, and file size checks.",
  },
  {
    title: "Social previews",
    description: "Twitter/X, LinkedIn, Facebook, Discord, WhatsApp, and Slack layouts.",
  },
  {
    title: "Site monitor",
    description: "Discover pages, scan in concurrent batches, and load more as you go.",
  },
  {
    title: "Batch & compare",
    description: "Multi-URL inspect plus staging vs production field diffs.",
  },
  {
    title: "CLI included",
    description: "Shared Rust core: prevu inspect <url> [--json].",
  },
  {
    title: "Desktop-native",
    description: "Tauri 2 shell for Windows, macOS, and Linux with a light memory footprint.",
  },
];

export const platforms = [
  {
    id: "windows",
    name: "Windows",
    detail: "NSIS (.exe) and MSI installers",
    exts: [".exe", ".msi"],
  },
  {
    id: "macos",
    name: "macOS",
    detail: "DMG / app bundles — Apple Silicon + Intel",
    exts: [".dmg"],
  },
  {
    id: "linux",
    name: "Linux",
    detail: "AppImage, .deb, and Arch AUR (prevu)",
    exts: [".appimage", ".deb"],
    note: "yay -S prevu",
  },
];

export const faqs = [
  {
    q: "Can PREVU inspect localhost URLs?",
    a: "Yes. Paste localhost, 127.0.0.1, or any local port — no public tunnel required.",
  },
  {
    q: "Where is my data stored?",
    a: "Inspection history and workspaces stay on your machine. PREVU does not upload your pages to a PREVU cloud.",
  },
  {
    q: "Which platforms are supported?",
    a: "Windows, macOS, and Linux. Installers ship from GitHub Releases; Arch users can install from the AUR.",
  },
  {
    q: "How do I keep the website version in sync?",
    a: "Bump version in the root package.json (and matching package manifests). The marketing site reads that version at build time.",
  },
  {
    q: "Is PREVU open source?",
    a: "Yes — MIT licensed as Prevu Contributors. Source, issues, and docs live on GitHub.",
  },
];

export const docLinks = [
  { label: "Development setup", href: `${REPO}/blob/master/docs/development.md` },
  { label: "Architecture", href: `${REPO}/blob/master/docs/architecture.md` },
  { label: "Contributing", href: CONTRIBUTING },
  { label: "Code of Conduct", href: `${REPO}/blob/master/CODE_OF_CONDUCT.md` },
];
