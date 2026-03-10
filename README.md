<p align="center">
  <img src="logo.png" alt="PREVU" width="100" />
</p>

<h2 align="center">PREVU</h2>

<p align="center">
  The Postman for OG Images — inspect, validate, and preview your site's social metadata without a public URL.
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

> [!WARNING]
> This is very much in beta and might be buggy here and there (but hope you have a good experience!).

> Most OG image issues are discovered only after deploying. PREVU brings that feedback loop to your local machine — paste any URL and instantly see how it renders across every major social platform, complete with validation, before you ever push.

---

## Screenshots

| Home | Preview | Validation |
|------|---------|------------|
| ![Home](https://res.cloudinary.com/dwir71gi2/image/upload/v1773144422/main-page-prevu_qwnymz.png) | ![Preview](https://res.cloudinary.com/dwir71gi2/image/upload/v1773144421/preview-page-prevu_mfnmcc.png) | ![Validation](https://res.cloudinary.com/dwir71gi2/image/upload/v1773144422/cover-compare-prevu_itrzhj.png) |

---

## Download

Get the latest installer from the [**Releases page**](https://github.com/dhanushk-offl/prevu/releases).

| Platform | Installer |
|----------|-----------|
| Windows | `.exe` (NSIS) · `.msi` |
| macOS | `.dmg` |
| Linux | `.AppImage` · `.deb` |

> Builds are currently unsigned. On macOS: System Settings → Privacy & Security → Open Anyway. On Windows: SmartScreen → More Info → Run Anyway.

---

## Installation

### Windows

**Using the NSIS installer (`.exe`) — recommended**

1. Download `PREVU_x.x.x_x64-setup.exe` from the [Releases page](https://github.com/dhanushk-offl/prevu/releases)
2. Double-click the installer
3. If **Windows SmartScreen** blocks the app:
   - Click **More info**
   - Click **Run anyway**
4. Follow the installer steps and launch PREVU from the Start Menu

**Using the MSI installer (`.msi`)**

1. Download `PREVU_x.x.x_x64_en-US.msi` from the [Releases page](https://github.com/dhanushk-offl/prevu/releases)
2. Double-click the `.msi` file
3. If prompted by SmartScreen, click **More info → Run anyway**
4. Follow the installation wizard

> **Why does SmartScreen appear?**  
> PREVU builds are not Authenticode-signed yet. SmartScreen flags unsigned executables by default. The app is safe — you can verify the source on this repository.

---

### macOS

1. Download `PREVU_x.x.x_x64.dmg` (Intel) or `PREVU_x.x.x_aarch64.dmg` (Apple Silicon) from the [Releases page](https://github.com/dhanushk-offl/prevu/releases)
2. Open **Finder** and navigate to your **Downloads** folder
3. Double-click the downloaded `.dmg` file to mount it (you'll see a new PREVU volume appear on your Desktop)
4. Drag the **PREVU** app icon into your **Applications** folder
5. Eject the PREVU volume by clicking the eject button next to it in Finder
6. Open **Launchpad** or **Applications** folder and double-click **PREVU** to launch

**If macOS blocks the app with "damaged" or "cannot be opened":**

**Option A (GUI - recommended):**
1. Open **System Settings** → **Privacy & Security**
2. Scroll down to find _"PREVU was blocked from use because it is not from an identified developer"_
3. Click **Open Anyway**
4. In the confirmation dialog, click **Open**

**Option B (Terminal):**
1. Open **Terminal** app (search for it in Spotlight or find it in Applications → Utilities)
2. Run this command to remove the quarantine flag:
   ```bash
   xattr -cr /Applications/PREVU.app
   ```
3. Launch PREVU normally

> **Why does this happen?**  
> PREVU builds are not code-signed with an Apple Developer ID yet. macOS Gatekeeper blocks unsigned apps by default for security. The app is safe — you can verify the source on this repository.

> **Why does Gatekeeper appear?**  
> macOS requires apps to be notarized by Apple or signed with a Developer ID certificate. PREVU is not notarized yet. The `xattr -cr` command is the standard developer workaround for this.

---

### Linux

**AppImage (universal — recommended)**

1. Download `PREVU_x.x.x_amd64.AppImage` from the [Releases page](https://github.com/dhanushk-offl/prevu/releases)
2. Make it executable and run:

```bash
chmod +x PREVU_x.x.x_amd64.AppImage
./PREVU_x.x.x_amd64.AppImage
```

Optionally move it to a permanent location:

```bash
mv PREVU_x.x.x_amd64.AppImage ~/.local/bin/prevu
chmod +x ~/.local/bin/prevu
```

Make sure `~/.local/bin` is in your `PATH`:

```bash
echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.bashrc
source ~/.bashrc
```

**Debian / Ubuntu (`.deb`)**

```bash
sudo dpkg -i PREVU_x.x.x_amd64.deb
```

If there are missing dependencies:

```bash
sudo apt-get install -f
```

Launch from your app menu or run:

```bash
prevu
```

**Removing PREVU on Linux**

```bash
# AppImage — just delete the file
rm ~/.local/bin/prevu

# .deb install
sudo dpkg -r prevu
```

> **Note:** PREVU requires a WebKitGTK runtime on Linux. If the app fails to launch, install it:
> ```bash
> # Ubuntu / Debian
> sudo apt-get install libwebkit2gtk-4.1-0
>
> # Fedora
> sudo dnf install webkit2gtk4.1
>
> # Arch
> sudo pacman -S webkit2gtk-4.1
> ```

---

## Features

- Inspect any URL — `localhost`, staging, or production
- Extract and display all Open Graph and Twitter Card tags
- Validate required tags, image dimensions, aspect ratio, and file size
- Render realistic social previews for Twitter, LinkedIn, Discord, WhatsApp, and Facebook
- Clipboard auto-preview — automatically inspects URLs you copy
- Watch mode — re-inspects every 5 seconds during active development
- Reusable CLI: `prevu inspect <url>` shares the same core logic as the desktop app
- Lightweight Tauri binary with minimal memory footprint

---

## Tech Stack

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

## Project Structure

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

## Development

### Prerequisites

- Node.js 20+
- Rust stable
- Platform Tauri deps: WebView2 (Windows), WebKitGTK (Linux)

### Setup

```bash
npm install
npm --prefix frontend install
```

### Run

```bash
npm run tauri:dev     # Full desktop app with hot reload
npm run dev           # Frontend only (browser)
```

### Build

```bash
npm run tauri:build
```

---

## CLI

```bash
cargo run --manifest-path cli/Cargo.toml -- inspect https://example.com
cargo run --manifest-path cli/Cargo.toml -- inspect https://example.com --json
```

```
[OK]   og:title detected
[OK]   og:description detected
[WARN] Missing twitter:card
[WARN] Image resolution too small (500x260). Minimum is 600x315
```

---

## Contributing

Contributions are welcome. Please read [CONTRIBUTING.md](CONTRIBUTING.md) and [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) before opening a pull request.

**Adding a new platform preview:**

1. Update the platform union type in `PreviewCard.tsx`
2. Add the style mapping for the new platform
3. Render the card in the preview tab in `Home.tsx`

---

## Star History

<p align="center">
  <a href="https://star-history.com/#dhanushk-offl/prevu&Date">
    <img src="https://api.star-history.com/svg?repos=dhanushk-offl/prevu&type=Date" alt="Star History Chart" width="600" />
  </a>
</p>

---

## Support the Project

If PREVU saved you from shipping a broken link preview, consider buying me a coffee.

<a href="https://buymeacoffee.com/itzmedhanu" target="_blank">
  <img src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png" alt="Buy Me A Coffee" width="160" />
</a>

---

## License

MIT © [dhanushk-offl](https://github.com/dhanushk-offl)
