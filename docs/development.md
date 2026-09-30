# Development

This document covers local development for the PREVU desktop app, frontend, and CLI.

## Prerequisites

- Bun `1.3.14+` (workspace `packageManager` in root `package.json`)
- Rust stable via [rustup](https://rustup.rs)
- Platform dependencies for [Tauri 2](https://v2.tauri.app/start/prerequisites/)

### Linux packages (Debian/Ubuntu example)

```bash
sudo apt-get update
sudo apt-get install -y \
  build-essential \
  curl \
  wget \
  file \
  libxdo-dev \
  libssl-dev \
  libayatana-appindicator3-dev \
  librsvg2-dev \
  patchelf \
  libwebkit2gtk-4.1-dev \
  libgtk-3-dev \
  libsoup-3.0-dev
```

## Setup

```bash
bun install
bun run tauri:dev
```

## Scripts

| Script | Description |
|--------|-------------|
| `bun run dev` | Frontend Vite server (`http://localhost:5173`) |
| `bun run build` | Build frontend into `frontend/dist` |
| `bun run tauri:dev` | Tauri desktop + Vite |
| `bun run tauri:build` | Release bundles for the host OS |
| `bun run cli -- …` | CLI entrypoint |
| `bun run website:dev` | Marketing site (`docs/webpage`) |
| `bun run website:build` | Build marketing site to `docs/webpage/dist` |

## Workspace layout

- `frontend/` — React UI invoked through Tauri commands
- `src-tauri/` — Rust backend (`inspect_url`, site monitor, compare, dialogs)
- `cli/` — CLI that reuses core inspection logic

## Icons

Regenerate native icons from the repo logo:

```bash
bun run tauri -- icon logo.png
```

## Continuous integration

- **PR Check** (`.github/workflows/pr-check.yml`): mandatory on every PR; builds Linux, Windows, and macOS — the macOS leg cross-compiles both Apple Silicon (`aarch64-apple-darwin`) and Intel (`x86_64-apple-darwin`) on a single `macos-14` runner
- **Build Desktop Installers** (`.github/workflows/build.yml`): produces installers on `master` / `main` (including both macOS architectures)
- **Release** (`.github/workflows/release.yml`): publishes GitHub Release artifacts for Windows, both macOS arches, and Linux

## Tips

- Prefer `bun install --frozen-lockfile` when verifying CI-like installs.
- Site monitor inspects URLs in concurrent batches of 10; keep network usage considerate when testing against production sites.
- Keep Tauri window permissions in `src-tauri/capabilities/` in sync when adding window APIs.
