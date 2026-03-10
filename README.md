# PREVU

Instant social preview inspector for developers.

PREVU is a lightweight cross-platform desktop app for inspecting Open Graph and Twitter metadata from localhost, staging, and production URLs. It parses metadata, validates critical tags, inspects OG image quality, and renders realistic previews for common social platforms.

## Features

- URL inspection for `localhost`, staging, and production targets
- Open Graph and Twitter meta extraction
- Validation checks for required tags and image constraints
- Social preview simulator for Twitter, LinkedIn, Discord, WhatsApp, and Facebook
- OG image inspector (resolution, file size, ratio)
- Metadata table viewer
- Clipboard auto-preview toggle
- Watch mode (auto re-inspect every 5 seconds)
- Reusable CLI (`prevu inspect <url>`) sharing parser and validator logic
- Lightweight Tauri + React architecture designed for small binaries

## Screenshots

- Desktop home: `docs/screenshots/home.png` (placeholder)
- Preview tab: `docs/screenshots/preview.png` (placeholder)
- Validation tab: `docs/screenshots/validation.png` (placeholder)

## Tech Stack

- Desktop: Tauri (Rust)
- Frontend: React + Vite + TypeScript + TailwindCSS
- Rust crates: `reqwest`, `scraper`, `image`, `serde`, `serde_json`, `tokio`, `arboard`

## Project Structure

```text
prevu/
  frontend/
    src/
      components/
      pages/
      styles/
  src-tauri/
    src/
      main.rs
      parser.rs
      validator.rs
      image_checker.rs
      clipboard_watcher.rs
  cli/
    prevu-cli.rs
```

## Installation

### Prerequisites

- Node.js 20+
- Rust stable
- OS dependencies for Tauri (WebView2 on Windows, WebKitGTK on Linux)

### Install dependencies

```bash
npm install
npm --prefix frontend install
```

## Development

Run desktop app in development mode:

```bash
npm run tauri:dev
```

Run frontend only:

```bash
npm run dev
```

Run CLI:

```bash
npm run cli -- inspect http://localhost:3000
```

## Build

Build desktop bundles:

```bash
npm run tauri:build
```

Tauri is configured to build:

- macOS `.dmg`
- Windows installer (`.exe` via NSIS)
- Linux `.AppImage`

## CLI Usage

```bash
cargo run --manifest-path cli/Cargo.toml -- inspect https://example.com
cargo run --manifest-path cli/Cargo.toml -- inspect https://example.com --json
```

Example output:

```text
[OK] og:title detected
[OK] og:description detected
[WARN] Missing twitter:card
[WARN] Image resolution too small (500x260). Minimum is 600x315
```

## How It Works

### Parser

`src-tauri/src/parser.rs` fetches HTML with `reqwest`, parses `<meta>` tags with `scraper`, normalizes relative URLs, and returns structured metadata.

### Validation

`src-tauri/src/validator.rs` checks:

- Required OG tags: `og:title`, `og:description`, `og:image`
- Presence of `twitter:card`
- Image resolution (min and recommended)
- Image aspect ratio (target ~1.91:1)
- Image file size threshold (5MB)

### Preview Rendering

`frontend/src/components/PreviewCard.tsx` renders card variants per platform using the same parsed metadata with platform-specific visual styles.

### Adding New Platform Preview

1. Update platform union in `PreviewCard.tsx`.
2. Add style mapping for the platform.
3. Render the new card in `Home.tsx` preview tab.

## Open Source

- License: MIT
- Contributions: see `CONTRIBUTING.md`
- Code of Conduct: see `CODE_OF_CONDUCT.md`

## Notes

- Clipboard access may depend on OS-level permissions.
- Localhost inspection requires PREVU to reach your local dev server.

## CI/CD (GitHub Actions)

PREVU includes a cross-platform build pipeline at:

`/.github/workflows/build.yml`

### How It Works

- Triggers on:
  - push to `main`
  - manual run via `workflow_dispatch`
- Uses a matrix to build in parallel on:
  - `windows-latest`
  - `macos-latest`
  - `ubuntu-latest`
- Per job it:
  - checks out code
  - sets up Node.js 20
  - installs Rust stable
  - caches npm and Rust dependencies
  - runs `npm install`
  - runs `npm run tauri -- build`
  - uploads installer artifacts from `src-tauri/target/release/bundle/`

### Build Artifacts

- Windows:
  - `.msi`
  - `.exe`
- macOS:
  - `.dmg`
  - `.app`
- Linux:
  - `.AppImage`
  - `.deb`

### How To Trigger Builds

1. Automatic: push a commit to `main`.
2. Manual:
   - Open GitHub repository
   - Go to `Actions` tab
   - Select `Build Desktop Installers`
   - Click `Run workflow`

### Where To Download Artifacts

1. Open the completed workflow run in `Actions`.
2. In the `Artifacts` section, download:
   - `prevu-windows-bundles`
   - `prevu-macos-bundles`
   - `prevu-linux-bundles`

### Publishing Releases Later

Recommended release flow:

1. Create and push a Git tag (for example `v0.2.0`).
2. Add a release workflow that triggers on `push.tags`.
3. Reuse this build process, then attach generated bundles to a GitHub Release.
4. Add code-signing/notarization:
   - Windows: Authenticode signing for `.exe`/`.msi`
   - macOS: Developer ID signing + notarization for `.app`/`.dmg`
   - Linux: optional signing/checksums for release assets

If you want, I can generate a second workflow (`release.yml`) that publishes artifacts directly to GitHub Releases.
