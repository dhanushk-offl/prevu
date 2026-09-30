# Architecture

PREVU is a Tauri 2 desktop application with a React frontend and a shared Rust inspection core.

```text
┌──────────────────────┐
│  frontend (React)    │  views: inspect, monitor, batch, compare, settings
└──────────┬───────────┘
           │ invoke()
┌──────────▼───────────┐
│  src-tauri (Rust)    │  commands + window shell
│  parser / validator  │
│  image_checker       │
└──────────┬───────────┘
           │ shared logic
┌──────────▼───────────┐
│  cli/                │  `prevu inspect <url>`
└──────────────────────┘
```

## Data flow

1. The UI calls a Tauri command (`inspect_url`, `discover_site_pages`, `monitor_inspect_batch`, …).
2. Rust fetches HTML with `reqwest`, extracts OG / Twitter tags with `scraper`, and optionally downloads the preview image.
3. The validator reports missing tags, dimension issues, and related warnings.
4. Results return as camelCase JSON for the React UI.

## Site monitor

1. Discover candidate URLs from sitemap or same-origin links (`discover_site_pages`).
2. Inspect pages in concurrent batches (`monitor_inspect_batch`).
3. The UI shows the first batch quickly and reveals more with Load more while later batches continue.

## Frontend views

| View | Role |
|------|------|
| Inspector | Single-URL preview, meta table, validation, image details |
| Site Monitor | Site-wide metadata health |
| Batch | Multi-URL table inspect |
| Compare | Staging vs production field diffs |
| History / Settings | Local history, preferences, about |

## Platform packaging

CI builds installers for Windows (NSIS/MSI), macOS (app/DMG), and Linux (AppImage/deb). Linux AppImage packaging verifies `.DirIcon` so catalog submissions do not fail on broken absolute icon symlinks.
