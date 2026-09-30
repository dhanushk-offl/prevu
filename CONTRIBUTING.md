# Contributing to PREVU

Thanks for helping improve PREVU. This guide covers setup, commands, conventions, and the pull request process.

## Code of conduct

By participating, you agree to follow the [Code of Conduct](CODE_OF_CONDUCT.md).

## Ways to contribute

- Bug reports and reproducible test cases
- Documentation improvements
- UI polish and accessibility fixes
- Parser / validator coverage
- Platform install and CI hardening

Please open an issue before large architectural changes so maintainers can align on direction.

## Development setup

### Prerequisites

- [Bun](https://bun.sh) `1.3.14` or compatible (see root `packageManager`)
- Rust stable (`rustup default stable`)
- Platform Tauri dependencies:
  - **Windows:** WebView2
  - **macOS:** Xcode Command Line Tools
  - **Linux:** WebKitGTK 4.1 and related build packages (see [docs/development.md](docs/development.md))

### Install and run

```bash
git clone https://github.com/dhanushk-offl/prevu.git
cd prevu
bun install
bun run tauri:dev
```

Frontend-only (browser, no native shell):

```bash
bun run dev
```

## Common commands

| Command | Purpose |
|---------|---------|
| `bun install` | Install workspace dependencies (root + `frontend`) |
| `bun run dev` | Vite frontend only |
| `bun run build` | Production frontend build |
| `bun run tauri:dev` | Desktop app with hot reload |
| `bun run tauri:build` | Production Tauri bundles for the current OS |
| `bun run tauri -- icon logo.png` | Regenerate `src-tauri/icons` from `logo.png` |
| `bun run cli -- inspect <url>` | Run the CLI inspector |
| `bun run cli -- inspect <url> --json` | CLI JSON output |
| `cargo check --manifest-path src-tauri/Cargo.toml` | Type-check the Rust crate |

Use `bun install --frozen-lockfile` in CI and when verifying lockfile integrity.

## Branching and pull requests

1. Fork (or create a branch from the latest `master`).
2. Keep the change focused: one concern per PR when practical.
3. Update docs when behavior or commands change.
4. Open a PR against `master`.
5. Ensure the mandatory **PR Check** workflow is green (Linux, Windows, macOS builds).

### PR checklist

- [ ] `bun install` and `bun run build` succeed locally
- [ ] `bun run tauri:dev` (or equivalent) validates the change
- [ ] CLI paths still work if shared Rust logic changed
- [ ] Docs / README updated when needed
- [ ] No unrelated formatting or lockfile churn
- [ ] PR description explains *why*, not only *what*

### Required CI

PRs targeting `master` must pass `.github/workflows/pr-check.yml`. That workflow builds the app on:

- Linux (`ubuntu-22.04`)
- Windows
- macOS

Do not merge with a failing **PR Check** status.

## Developer conventions

### General

- Prefer small, reviewable diffs.
- Match existing naming and layout in nearby files.
- Do not commit secrets, local `.env` files, or generated `target/` / `dist/` artifacts.
- Avoid drive-by refactors unrelated to the ticket.

### TypeScript / React (`frontend/`)

- Use TypeScript types for invoke payloads and component props.
- Prefer existing UI primitives and CSS variables over one-off styles.
- Keep components focused; put shared helpers in `frontend/src/lib/`.
- Do not add heavy UI libraries unless the change clearly needs them.
- Preserve accessibility for dialogs, buttons, and keyboard flows.

### Rust (`src-tauri/`, `cli/`)

- Keep desktop and CLI on shared logic under `src-tauri/src` when possible.
- Return structured errors (`InspectError` / `Result`) instead of panicking in library code.
- Prefer `serde` camelCase for values crossing the Tauri boundary.
- Add or extend validation coverage when changing parser or image rules.
- Avoid unbounded network fan-out; site monitor batches are intentional.

### Commits

- Use clear, imperative commit subjects (example: `Fix SemVer prerelease ordering`).
- Explain motivation in the body when the diff is non-obvious.
- Do not force-push shared long-lived branches without coordination.

### Documentation

- Put user-facing install notes in `README.md`.
- Put contributor setup and conventions in this file.
- Put deeper design notes in `docs/`.

## Reporting bugs

Include:

- PREVU version (or commit SHA)
- OS and architecture
- Steps to reproduce
- Expected vs actual behavior
- Relevant logs or screenshots

## Security

Do not open public issues for sensitive security reports. Contact the maintainers privately via GitHub Security Advisories for this repository when available, or by messaging a maintainer listed on the GitHub org/profile.

## License

Contributions are accepted under the [MIT License](LICENSE) as Prevu Contributors.
