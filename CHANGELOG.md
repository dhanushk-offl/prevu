# Changelog

All notable changes to PREVU are recorded here. Versions follow
[Semantic Versioning](https://semver.org/).

## [0.1.6] — unreleased at tag time

Catch broken social previews before you ship. Inspects Open Graph and Twitter Card
metadata on localhost, staging, or production.

**Downloads:** Windows `.exe` / `.msi` · macOS `.dmg` (Apple Silicon **and** Intel) ·
Linux `.AppImage` / `.deb` · Arch AUR `yay -S prevu`

macOS and Windows builds are not code-signed. You may need to allow the app through
Gatekeeper (macOS) or SmartScreen (Windows).

### Added

- **macOS Intel builds.** Both Apple Silicon (`aarch64`) and Intel (`x64`) DMGs are
  now built, documented, and linked individually on the website. The release notes
  previously listed only Apple Silicon even though both architectures were shipping.
- **Marketing website** (`docs/webpage`). A Vite + React site presenting features,
  screenshots, and per-platform download links. Release assets are resolved live
  from the GitHub Releases API, so download buttons track the latest published build.
- **Mandatory cross-platform PR checks.** `.github/workflows/pr-check.yml` now
  gates every PR to `master` under a required status check, building Linux, Windows,
  and macOS. Windows and macOS breakage is caught before merge rather than at release.
- **Arch AUR publishing.** The release workflow updates `aur.archlinux.org/prevu`
  automatically, gated on the `AUR_SSH_PRIVATE_KEY` secret being present so a fork
  without the secret skips cleanly instead of failing.
- **New desktop UI components** — custom title bar, viewport/compare view selector,
  batch inspector, clipboard-watcher indicator, watch-mode toggle, and an
  in-app update dialog.

### Changed

- **Single macOS CI job builds both architectures.** The Apple Silicon and Intel
  matrix legs were merged into one `macos-14` runner that cross-compiles
  `aarch64-apple-darwin` and `x86_64-apple-darwin` in sequence, still producing one
  DMG per architecture. The build asserts both DMGs exist, so a half-successful
  cross-build fails the job instead of shipping a release missing an architecture.
- **Retired runner label replaced.** `macos-13` is no longer a supported hosted
  runner; the Intel leg moved to `macos-15-intel`.
- **Bun replaces npm.** The monorepo migrated to Bun (`bun.lock` at the root, with
  an independent lockfile for the website). `frontend/package-lock.json` was removed.
- **AppImage catalog metadata fixed.** The Linux AppImage now ships a correct
  `.DirIcon`, and CI verifies it after building rather than assuming it.

### Fixed

- **Website accessibility — screenshot lightbox.** Tab and Shift+Tab are now trapped
  within the dialog and wrap at either end, the page behind it is marked `inert`
  while open, and focus returns to the triggering thumbnail on close. Previously
  keyboard focus could escape into the background behind the modal.
- **Website downloads — architecture confusion.** The download section took only the
  first matching asset (`assets[0]`), so with two `.dmg` files in a release the
  Apple Silicon and Intel links were collapsed into one arbitrary choice. Each
  matching asset is now rendered with its architecture, and single-asset cases are
  unchanged.
- **Website — `/favicon.ico` and asset paths.** Absolute paths verified for hosting
  at a domain root.

### Security

- **Vite upgraded to 6.4.3** in both the desktop app (`frontend/`) and the marketing
  website (`docs/webpage/`) to clear a published advisory. Lockfiles updated to match.

### Documentation

- Added `docs/architecture.md`, expanded `docs/development.md`, and added
  `docs/README.md` as an index.
- README restructured with clearer install instructions and CI badges.
- `CONTRIBUTING.md` documents the mandatory PR Check and lockfile-integrity workflow.
- Cloudflare Pages deployment settings for the website are documented.

[0.1.6]: https://github.com/dhanushk-offl/prevu/compare/v0.1.5...v0.1.6
