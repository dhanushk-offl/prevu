# Contributing to PREVU

Thanks for contributing.

## Development setup

1. Install Node.js and Rust.
2. Install dependencies:

```bash
npm install
npm --prefix frontend install
```

3. Start the desktop app:

```bash
npm run tauri:dev
```

## Contribution guidelines

- Keep changes focused and small.
- Reuse shared Rust logic in `src-tauri/src` for both desktop and CLI.
- Prefer adding tests for parser and validator changes.
- Follow existing TypeScript and Rust style.

## Pull request checklist

- [ ] Code compiles locally
- [ ] UI and CLI behavior validated
- [ ] Docs updated if behavior changed
- [ ] No unrelated changes included
