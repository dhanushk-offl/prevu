<p align="center">
  <img src="logo.png" alt="PREVU" width="88" />
</p>

<h1 align="center">PREVU</h1>

<p align="center">
  Inspect, validate, and preview Open Graph and Twitter Card metadata locally — before you ship.
</p>

<p align="center">
  <a href="https://github.com/dhanushk-offl/prevu/actions/workflows/pr-check.yml">
    <img src="https://github.com/dhanushk-offl/prevu/actions/workflows/pr-check.yml/badge.svg" alt="PR Check" />
  </a>
  <a href="https://github.com/dhanushk-offl/prevu/actions/workflows/build.yml">
    <img src="https://github.com/dhanushk-offl/prevu/actions/workflows/build.yml/badge.svg" alt="Build" />
  </a>
  <a href="https://github.com/dhanushk-offl/prevu/releases/latest">
    <img src="https://img.shields.io/github/v/release/dhanushk-offl/prevu?display_name=tag&label=release" alt="Latest release" />
  </a>
  <a href="https://github.com/dhanushk-offl/prevu/blob/master/LICENSE">
    <img src="https://img.shields.io/github/license/dhanushk-offl/prevu" alt="License" />
  </a>
  <a href="https://github.com/dhanushk-offl/prevu">
    <img src="https://img.shields.io/github/languages/top/dhanushk-offl/prevu" alt="Top language" />
  </a>
  <img src="https://img.shields.io/badge/Rust-000000?logo=rust&logoColor=white" alt="Rust" />
  <img src="https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Tauri-24C8DB?logo=tauri&logoColor=white" alt="Tauri" />
  <img src="https://img.shields.io/badge/platform-Windows%20%7C%20macOS%20%7C%20Linux-4c4c4c" alt="Platforms" />
</p>

---

## Why PREVU?

Most broken social previews show up only after deploy. PREVU runs on your machine so you can paste a `localhost`, staging, or production URL and see metadata, validation warnings, and platform previews before anything ships.

## Screenshots

| Home | Site scan |
|------|-----------|
| ![Home](https://www.podu.pics/4N_-H50wW5) | ![Site scan](https://www.podu.pics/kBh8sQ4HAX) |

| Batch testing | Staging vs production |
|---------------|------------------------|
| ![Batch testing](https://www.podu.pics/JFC1UZvStF) | ![Local and staging comparison](https://www.podu.pics/HnmG9n2t6C) |

| Local URL / port testing |
|--------------------------|
| ![Local URL and port testing](https://www.podu.pics/IpVQNDVQ_k) |

## Features

- Inspect any URL (`localhost`, staging, or production)
- Extract Open Graph and Twitter Card tags
- Validate required tags, image dimensions, aspect ratio, and file size
- Social previews for Twitter/X, LinkedIn, Facebook, Discord, WhatsApp, and Slack
- Site monitor with progressive batched scans
- Batch inspect and staging vs production compare
- Clipboard URL helper and workspace save/load
- Shared Rust CLI: `prevu inspect <url>`

## Download

Installers are published on the [Releases](https://github.com/dhanushk-offl/prevu/releases) page.

| Platform | Artifacts |
|----------|-----------|
| Windows | `.exe` (NSIS), `.msi` |
| macOS | `.dmg` / `.app` (Apple Silicon builds via CI) |
| Linux | `.AppImage`, `.deb`, Arch AUR (`prevu`) |

Builds are currently unsigned. Use the platform notes below if Gatekeeper or SmartScreen blocks the first launch.

## Installation

<details>
<summary><strong>Windows</strong></summary>

1. Download `PREVU_*_x64-setup.exe` (or the `.msi`) from [Releases](https://github.com/dhanushk-offl/prevu/releases).
2. Run the installer.
3. If SmartScreen appears: **More info → Run anyway**.

</details>

<details>
<summary><strong>macOS</strong></summary>

1. Download the `.dmg` for your architecture.
2. Open it, drag **PREVU** into **Applications**, then eject.
3. If macOS reports the app is damaged or blocked:

```bash
xattr -cr /Applications/PREVU.app
```

Or use **System Settings → Privacy & Security → Open Anyway**.

</details>

<details>
<summary><strong>Linux</strong></summary>

**Arch (AUR)**

```bash
yay -S prevu
```

**AppImage**

```bash
chmod +x PREVU_*_amd64.AppImage
./PREVU_*_amd64.AppImage
```

**Debian / Ubuntu**

```bash
sudo dpkg -i PREVU_*_amd64.deb
sudo apt-get install -f
```

WebKitGTK is required. On Ubuntu/Debian:

```bash
sudo apt-get install libwebkit2gtk-4.1-0
```

</details>

## Quick start (development)

Prerequisites: [Bun](https://bun.sh) 1.3+, Rust stable, and platform Tauri dependencies.

```bash
bun install
bun run tauri:dev
```

Frontend only:

```bash
bun run dev
```

CLI:

```bash
bun run cli -- inspect https://example.com
bun run cli -- inspect https://example.com --json
```

More detail: [docs/development.md](docs/development.md) and [CONTRIBUTING.md](CONTRIBUTING.md).

## Documentation

| Doc | Description |
|-----|-------------|
| [docs/development.md](docs/development.md) | Local setup, scripts, architecture notes |
| [docs/architecture.md](docs/architecture.md) | How the desktop app, parser, and CLI fit together |
| [CONTRIBUTING.md](CONTRIBUTING.md) | Contribution workflow and conventions |
| [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) | Community standards |

## Project structure

```text
prevu/
├── frontend/          # React + Vite + TypeScript UI
├── src-tauri/         # Tauri / Rust backend
├── cli/               # Shared-logic CLI
├── docs/              # Developer documentation
└── .github/workflows/ # PR checks, build, release
```

## Tech stack

| Layer | Technology |
|-------|------------|
| Desktop | Tauri 2 (Rust) |
| UI | React, Vite, TypeScript, Tailwind CSS |
| HTTP / HTML | `reqwest`, `scraper` |
| Images | `image` |
| Clipboard | `arboard` |
| Async | `tokio` |

## Contributing

Contributions are welcome. Please read [CONTRIBUTING.md](CONTRIBUTING.md) and [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) before opening a pull request.

Every PR must pass the mandatory **PR Check** workflow (Linux, Windows, and macOS builds).

## Support

If PREVU helps you catch a broken preview before ship, you can support development here:

[Buy Me a Coffee](https://buymeacoffee.com/itzmedhanu)

## License

[MIT](LICENSE) © Prevu Contributors
