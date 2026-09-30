# PREVU marketing site

Vite + React landing page for PREVU. Lives in `docs/webpage` so product docs and the website stay together.

## Version sync

The site injects `__PREVU_VERSION__` from the **repository root** `package.json` at build time (`vite.config.js`).

1. Bump `version` in `/package.json` (and matching manifests as usual).
2. Rebuild the website — the nav pill and footer show the new version automatically.
3. Download buttons still resolve assets from the latest GitHub Release at runtime.

Screenshot URLs and feature copy live in `src/content.js` and should stay aligned with the root `README.md`.

## Develop

From the repo root:

```bash
bun run website:dev
```

Or from this folder:

```bash
bun install
bun run dev
```

## Build

```bash
bun run website:build
```

Output: `docs/webpage/dist`.

## Routes

- `/` — product home
- `/guide` — installation guide (client history routing; configure SPA fallback on your host)
