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
- `pnpm dist` - package the app with electron-builder
