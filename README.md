# tick tea

A minimalist timer for brewing tea through successive infusions. Set the starting duration and the time added to each subsequent infusion. There is no tea catalog or recipe collection. Russian and English interfaces, history for the current tea session, and offline support are available without accounts or a server.

## Getting started

Requires Node.js 22.12+ and npm.

```sh
npm ci
npm run dev
```

```sh
npm test          # Timer model, storage and user scenarios
npm run lint
npm run build     # TypeScript, production build and service worker
npm run preview
```

## Usage

1. Open the page: the timer is available immediately, with a default duration of 30 seconds and an increment of +5 seconds.
2. Click the starting duration or increment above the timer to set your own values. Duration ranges from 1 to 3599 seconds; the increment ranges from 0 to 3599 seconds.
3. Click “Start infusion”. You can pause and resume the countdown.
4. Completed infusions appear in the history. “Next infusion” prepares the duration with the increment applied but does not start the countdown.
5. Adjust the current infusion duration precisely or with the ±5-second buttons before starting or while paused. Editing while paused resets the countdown to the selected duration.
6. Confirm “End tea session” to clear the history and restore the defaults.

The increment is applied to the selected duration of the previous infusion: an increment of +15 seconds produces 40 → 55 → 70; if you change the second infusion to 30 seconds, the third will be 45 seconds. A zero increment keeps the duration unchanged. The maximum duration is 59:59.

## Storage and accuracy

Switch between Russian and English in the app settings. Russian is the default. The selection is stored in `localStorage` under `tick-tea:language` and persists between visits. Switching languages does not reset the timer or history; both languages are available offline. If storage is unavailable, the language selection lasts until the page is reloaded.

The current timer, increment, history and notification settings are stored in `sessionStorage` under `tick-tea:v2`. Reloading the page restores the current tea session. Data belongs to the current tab; there is no permanent archive of tea sessions. The browser may restore `sessionStorage` when restoring a tab. Legacy catalog records in `localStorage` are not read.

A corrupted record starts a new timer. If storage fails, the timer continues to work in memory and the app displays a warning.

Starting the timer saves `endsAt = Date.now() + remainingMs`. The remaining time is calculated from the end timestamp rather than by decrementing a counter on each tick. Returning to the tab or reloading the page reconciles the state with the current time. Pausing preserves the remaining milliseconds. Restarting does not duplicate the current infusion's history entry.

The browser may delay sound and vibration while the app is in the background or the device is locked. The app displays the current state when you return. Changes to the system clock affect the timer. Sound is unlocked by a user gesture; vibration depends on browser support.

## Project structure

- `src/lib/session.ts` — timer model, increment, history and state transitions.
- `src/lib/storage.ts` — session validation and restoration.
- `src/hooks/useTeaSession.ts` — state, storage and notification management.
- `src/hooks/useTimer.ts` — timer display updates.
- `src/components/` — timer screen, circular indicator and dialogs.
- `src/styles.css` — styling and responsive layout.
- `vite.config.ts` — build, tests, manifest and service worker.

## PWA and offline support

The production build generates a manifest, icons and a service worker. All resources, including the font, are local. After the first successful load and service worker installation, the app works offline. The service worker requires HTTPS or localhost and is disabled in development mode.

Installation is available in the settings. On iPhone: Safari → Share → Add to Home Screen. On Android and desktop, use the browser's installation menu.

## Free deployment

### Cloudflare Pages

1. Connect the repository via **Workers & Pages → Create → Pages → Import an existing Git repository**.
2. Build command: `npm run build`; output directory: `dist`.
3. Node.js version: 24 (set the `NODE_VERSION=24` environment variable if needed).
4. For deployment at the domain root, leave `VITE_BASE_PATH` unset (the default is `/`). Deploy the site.

The app uses no server functions or Worker runtime.

### GitHub Pages

Project Pages requires the repository path: `VITE_BASE_PATH=/tick-tea/`. For a custom domain or `username.github.io`, use `/`.

The workflow in `.github/workflows/deploy.yml` runs lint and tests, builds static files and deploys to Pages on pushes to `main` or manual runs. Select **GitHub Actions** under **Settings → Pages → Source**. The workflow calculates the base path automatically from the repository name; for a custom domain, change `VITE_BASE_PATH` to `/`.

You can also build and upload `dist/` manually to any other static host:

```sh
VITE_BASE_PATH=/tick-tea/ npm run build
```

Icons, the manifest, the service worker and assets are built relative to the selected base path. Check the deployed site at a URL with a trailing `/`.
