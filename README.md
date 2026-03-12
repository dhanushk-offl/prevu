<p align="center">
  <img src="logo.png" alt="PREVU" width="90" />
</p>

<h1 align="center">PREVU</h1>

<p align="center">
  <b>The Postman for OG Images.</b><br/>
  Inspect, validate, and preview your site's social metadata — no public URL needed.
</p>

<p align="center">
  <a href="https://github.com/dhanushk-offl/prevu/actions/workflows/build.yml">
    <img src="https://github.com/dhanushk-offl/prevu/actions/workflows/build.yml/badge.svg" alt="Build" />
  </a>
  <a href="https://github.com/dhanushk-offl/prevu/releases">
    <img src="https://img.shields.io/github/v/release/dhanushk-offl/prevu?include_prereleases&label=release&color=blue" alt="Release" />
  </a>
  <a href="https://github.com/dhanushk-offl/prevu/blob/master/LICENSE">
    <img src="https://img.shields.io/github/license/dhanushk-offl/prevu?color=blue" alt="License" />
  </a>
  <img src="https://img.shields.io/badge/platform-Windows%20%7C%20macOS%20%7C%20Linux-blue" alt="Platforms" />
  <img src="https://img.shields.io/badge/built%20with-Tauri%20%2B%20React-orange" alt="Stack" />
</p>

---

## 🎬 See It in Action

<p align="center">
  <a href="https://youtu.be/LRSPw2DTqvY?si=OIiLq7gdZ2iD1lOI">
    <img src="https://img.youtube.com/vi/LRSPw2DTqvY/maxresdefault.jpg" alt="PREVU Demo" width="700" style="border-radius: 12px;" />
  </a>
  <br/>
  <a href="https://youtu.be/LRSPw2DTqvY?si=OIiLq7gdZ2iD1lOI">▶️ Watch the full demo on YouTube</a>
</p>

---

## ✨ Why PREVU?

> Most OG image issues are discovered only *after* deploying. PREVU closes that feedback loop — paste any URL and instantly see how it renders across every major social platform, with full validation, right on your local machine.

No more pushing to staging just to check a link preview. No more broken thumbnails going live. **Ship with confidence.**

---

## 📸 Screenshots

| Home | Preview | Validation |
|------|---------|------------|
| ![Home](https://res.cloudinary.com/dwir71gi2/image/upload/v1773144422/main-page-prevu_qwnymz.png) | ![Preview](https://res.cloudinary.com/dwir71gi2/image/upload/v1773144421/preview-page-prevu_mfnmcc.png) | ![Validation](https://res.cloudinary.com/dwir71gi2/image/upload/v1773144422/cover-compare-prevu_itrzhj.png) |

---

## 🚀 Features

| | Feature |
|---|---|
| 🔍 | **Inspect any URL** — `localhost`, staging, or production |
| 🏷️ | **Extract all metadata** — Open Graph and Twitter Card tags at a glance |
| ✅ | **Validate** — required tags, image dimensions, aspect ratio, and file size |
| 👀 | **Social Previews** — realistic renders for Twitter, LinkedIn, Discord, WhatsApp & Facebook |
| 📋 | **Clipboard auto-preview** — automatically inspects URLs you copy |
| 🔄 | **Watch mode** — re-inspects every 5 seconds during active development |
| ⚡ | **CLI included** — `prevu inspect <url>` shares core logic with the desktop app |
| 🪶 | **Lightweight** — Tauri binary with a minimal memory footprint |

---

## 📦 Download

Get the latest installer from the [**Releases page →**](https://github.com/dhanushk-offl/prevu/releases)

| Platform | Installer |
|----------|-----------|
| 🪟 Windows | `.exe` (NSIS) · `.msi` |
| 🍎 macOS | `.dmg` (Intel & Apple Silicon) |
| 🐧 Linux | `.AppImage` · `.deb` · Arch AUR |

> ⚠️ Builds are currently unsigned. See the platform-specific notes below to bypass Gatekeeper / SmartScreen.

---

## 🛠️ Installation

<details>
<summary><b>🪟 Windows</b></summary>

**Using the NSIS installer (`.exe`) — recommended**

1. Download `PREVU_x.x.x_x64-setup.exe` from [Releases](https://github.com/dhanushk-offl/prevu/releases)
2. Double-click the installer
3. If **Windows SmartScreen** blocks it → **More info → Run anyway**
4. Follow the wizard and launch from the Start Menu

**Using the MSI installer (`.msi`)**

1. Download `PREVU_x.x.x_x64_en-US.msi`
2. Double-click and follow the wizard (SmartScreen → **More info → Run anyway**)

> SmartScreen appears because PREVU is not Authenticode-signed yet. The app is safe — verify the source here.

</details>

<details>
<summary><b>🍎 macOS</b></summary>

1. Download the `.dmg` for your chip — `x64` (Intel) or `aarch64` (Apple Silicon)
2. Open the `.dmg`, drag **PREVU** to **Applications**, then eject the volume
3. Launch from Launchpad or Applications

**If macOS says the app is "damaged" or "cannot be opened":**

**Option A — GUI:**
> System Settings → Privacy & Security → scroll down → **Open Anyway**

**Option B — Terminal:**
```bash
xattr -cr /Applications/PREVU.app
```

> macOS Gatekeeper blocks apps not signed with an Apple Developer ID. PREVU is not notarized yet — `xattr -cr` is the standard developer workaround.

</details>

<details>
<summary><b>🐧 Linux</b></summary>

**Arch Linux (AUR)** — install directly on your Arch machine with:
```bash
yay -S prevu
```

**AppImage — universal, recommended**
```bash
chmod +x PREVU_x.x.x_amd64.AppImage
./PREVU_x.x.x_amd64.AppImage

# Optionally move to PATH
mv PREVU_x.x.x_amd64.AppImage ~/.local/bin/prevu
echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.bashrc && source ~/.bashrc
```

**Debian / Ubuntu (`.deb`)**
```bash
sudo dpkg -i PREVU_x.x.x_amd64.deb
sudo apt-get install -f  # fix any missing deps
prevu
```

**Uninstall**
```bash
rm ~/.local/bin/prevu          # AppImage
sudo dpkg -r prevu             # .deb
```

> PREVU requires a WebKitGTK runtime. If the app fails to launch:
> ```bash
> # Ubuntu/Debian
> sudo apt-get install libwebkit2gtk-4.1-0
> # Fedora
> sudo dnf install webkit2gtk4.1
> # Arch
> sudo pacman -S webkit2gtk-4.1
> ```

</details>

---

## 💻 CLI

```bash
cargo run --manifest-path cli/Cargo.toml -- inspect https://example.com
cargo run --manifest-path cli/Cargo.toml -- inspect https://example.com --json
```

**Example output:**
```
[OK]   og:title detected
[OK]   og:description detected
[WARN] Missing twitter:card
[WARN] Image resolution too small (500x260). Minimum is 600x315
```

---

## 🏗️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Desktop shell | Tauri (Rust) |
| Frontend | React + Vite + TypeScript + TailwindCSS |
| HTML parsing | `reqwest` + `scraper` |
| Image analysis | `image` crate |
| Clipboard | `arboard` |
| Serialization | `serde` + `serde_json` |
| Async runtime | `tokio` |

---

## 🗂️ Project Structure

```
prevu/
├── frontend/               # React + Vite frontend
│   └── src/
│       ├── components/     # PreviewCard, MetaTable, etc.
│       └── pages/
├── src-tauri/              # Tauri Rust backend
│   └── src/
│       ├── main.rs
│       ├── parser.rs
│       ├── validator.rs
│       ├── image_checker.rs
│       └── clipboard_watcher.rs
└── cli/                    # Standalone CLI
    └── prevu-cli.rs
```

---

## 🧑‍💻 Development

**Prerequisites:** Node.js 20+, Rust stable, platform Tauri deps (WebView2 on Windows, WebKitGTK on Linux)

```bash
# Install dependencies
npm install
npm --prefix frontend install

# Run
npm run tauri:dev     # Full desktop app with hot reload
npm run dev           # Frontend only (browser)

# Build
npm run tauri:build
```

**Adding a new platform preview:**
1. Update the platform union type in `PreviewCard.tsx`
2. Add the style mapping for the new platform
3. Render the card in the preview tab in `Home.tsx`

---

## 🤝 Contributing

Contributions are welcome! Please read [CONTRIBUTING.md](CONTRIBUTING.md) and [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) before opening a pull request.

---

## 📈 Star History

<p align="center">
  <a href="https://star-history.com/#dhanushk-offl/prevu&Date">
    <img src="https://api.star-history.com/svg?repos=dhanushk-offl/prevu&type=Date" alt="Star History Chart" width="600" />
  </a>
</p>

---

## ☕ Support

If PREVU saved you from shipping a broken link preview, consider buying me a coffee!

<a href="https://buymeacoffee.com/itzmedhanu" target="_blank">
  <img src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png" alt="Buy Me A Coffee" width="160" />
</a>

---

## 📄 License

MIT © [Dhanush Kandhan](https://akadhanu.pages.dev)
