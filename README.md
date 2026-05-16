# qwill

qwill is a personal, offline-first writing editor built with Electron, Svelte 5, and TypeScript.

## Development

```bash
pnpm install
pnpm dev
```

If `pnpm` is not installed, either install it through Corepack or run the pinned version with:

```bash
npx --yes pnpm@10.11.0 install
```

If an existing install skipped Electron's postinstall script, run:

```bash
pnpm rebuild electron esbuild
```

## Scripts

- `pnpm dev` - start Electron and Vite with HMR
- `pnpm typecheck` - run Svelte and TypeScript checks
- `pnpm build` - create a production build
- `pnpm icons` - regenerate `build/icon.png`, `build/icon.ico`, and `build/icon.icns`
- `pnpm dist` - package the app with electron-builder for the current platform
- `pnpm dist:mac` - build an unsigned Apple Silicon DMG
- `pnpm dist:win` - build an unsigned x64 NSIS installer
- `pnpm dist:linux` - build x64 AppImage and deb artifacts

The same scripts can be run with `npm run ...` in local environments that do not have `pnpm` installed.

## Local Releases

Regenerate icons before a release if the icon source script changed:

```bash
npm run icons
```

Build platform artifacts:

```bash
npm run dist:mac
npm run dist:win
npm run dist:linux
```

Expected artifact paths:

- macOS Apple Silicon DMG: `dist-electron/Qwill-0.1.0-draft-mac-arm64.dmg`
- Windows NSIS installer: `dist-electron/Qwill-0.1.0-draft-win-x64.exe`
- Linux AppImage: `dist-electron/Qwill-0.1.0-draft-linux-x64.AppImage`
- Linux deb: `dist-electron/Qwill-0.1.0-draft-linux-x64.deb`

Cross-platform packaging can require host tooling such as Wine for Windows builds and Linux packaging tools for deb/AppImage builds. The canonical macOS verification command after `npm run dist:mac` is:

```bash
dist-electron/mac-arm64/Qwill.app/Contents/MacOS/Qwill --qwill-smoke-test-drafts
```

The smoke test starts the packaged app binary without the Vite dev server, creates a draft in the platform app data `drafts/` folder, writes content, reads it back, verifies the in-memory index, removes the test draft, and prints a JSON result.
