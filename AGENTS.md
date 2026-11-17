# Repository Guidelines

## Project Structure & Module Organization

Tick tea is a Russian-language, offline-capable tea infusion timer built with React, TypeScript, and Vite.

- `src/App.tsx` coordinates the interface; `src/components/` contains brewing controls, the timer, and dialogs.
- `src/lib/session.ts` defines timer state transitions; `storage.ts` validates and restores sessions; `feedback.ts` handles completion signals.
- `src/hooks/` connects session state, clock updates, storage, and feedback to React.
- Tests live beside source files as `*.test.ts` or `*.test.tsx`.
- `src/styles.css` and `src/fonts.css` provide styling; `public/` contains icons and font licensing.
- `vite.config.ts` configures builds, Vitest, and PWA generation. Production output goes to `dist/`.

## Build, Test, and Development Commands

Use Node.js 22.12+ and npm.

- `npm ci`: install dependencies from `package-lock.json`.
- `npm run dev`: start the Vite development server.
- `npm test`: run the Vitest suite once.
- `npm run test:watch`: rerun tests during development.
- `npm run lint`: check ESLint and React Hooks rules.
- `npm run build`: run TypeScript checks and generate production assets and the service worker.
- `npm run preview`: serve the production build locally.
- `npm run format`: apply Prettier to the configured source and configuration files.

## Coding Style & Naming Conventions

Follow existing two-space indentation, double quotes, semicolons, and Prettier formatting. TypeScript uses strict checks; avoid unused declarations. Use PascalCase for component files, `use`-prefixed camelCase for hooks, and camelCase for functions and variables. Keep timer calculations and transitions in `src/lib/`, with browser effects in hooks or feedback helpers. Preserve Russian interface text and accessible control labels.

## Testing Guidelines

Use Vitest and React Testing Library. Tests default to Node; browser-dependent tests declare `// @vitest-environment jsdom`. Use fake timers for deterministic countdown scenarios. Cover changed transitions, pause/resume behavior, restoration, malformed storage, and duplicate completion handling. No coverage threshold is configured. Run tests, lint, and the production build before submitting.

## Commit & Pull Request Guidelines

Existing commits use short, imperative English subjects, such as `Simplify app to a session-based infusion timer`. Follow that style. PRs should describe behavior changes, include validation results, link relevant issues, and provide screenshots for interface changes.

## Storage & Deployment

Session data uses `sessionStorage` under `tick-tea:v2`. Preserve timestamp-based countdowns and offline operation. For subpath hosting, build with `VITE_BASE_PATH=/tick-tea/ npm run build`. Verify service-worker behavior using a production build on localhost or HTTPS.

## Public Repository & Sensitive Data

This repository is public. Before every commit, review all staged files and `git diff --cached` for secrets and sensitive data, including API keys, tokens, passwords, private keys, credentials, personal data, and confidential information. Check newly added files, configuration, logs, fixtures, and assets as well as code. Remove sensitive content from the staged changes before committing; keep local secrets in ignored files and use placeholders in examples. Never commit until this review is complete. If a secret has already been committed, revoke or rotate it immediately; deleting it in a later commit does not remove it from Git history.
