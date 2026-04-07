# Deep Dive: `@servicenow/sdk` (v4.5.0)

This package is the umbrella entrypoint. It does not implement build/deploy internals itself; it stitches `sdk-cli`, `sdk-api`, and `sdk-core` into one install and exposes executable commands.

## Evidence Source (`npm pack`)

Captured from `npm pack @servicenow/sdk` (tarball: `servicenow-sdk-4.5.0.tgz`):

- Name/version: `@servicenow/sdk@4.5.0`
- Description: `ServiceNow SDK`
- Engines: `node >=20.18.0`, `pnpm >=10.8.0`
- Runtime deps: `@servicenow/sdk-cli`, `@servicenow/sdk-api`, `@servicenow/sdk-core`
- CLI bins: `now-sdk`, `now-sdk-debug`, `@servicenow/sdk`
- Tarball top paths: `docs/`, `dist/`, `src/`, `bin/`

## What It Owns

- Stable install command for users: `npm i @servicenow/sdk`
- CLI entrypoint binaries
- Export map for sub-surfaces (`./api`, `./lsp`, `./core`, `./global`, `./automation`)
- Dependency pinning for the three primary SDK layers

## Functioning Model

```mermaid
flowchart LR
  U[Developer or CI] --> B[@servicenow/sdk bins]
  B --> C[@servicenow/sdk-cli]
  C --> A[@servicenow/sdk-api]
  A --> P[@servicenow/sdk-build-plugins]
  A --> K[@servicenow/sdk-core]
```

## Why This Layer Exists

Without the umbrella package, teams would need to manually align versions of multiple SDK packages. `@servicenow/sdk` enforces a known-good composition and reduces version skew.

## Source References

- `https://www.npmjs.com/package/@servicenow/sdk`
- `npm pack @servicenow/sdk`

## Tarball Evidence (from docs/npm-packs/extract)

- package.json highlights:
  - `version: 4.5.0`
  - `bin: { "now-sdk": "./bin/index.js", "now-sdk-debug": "./bin/debug.js", "@servicenow/sdk": "./bin/index.js" }`
  - exports map:
    - `./api` → Node default `./dist/api/index.js`, browser `./dist/web/index.js`, types `./dist/api/index.d.ts`
    - `./api/browser` → `./dist/web/index.js` (types `./dist/api/index.d.ts`)
    - `./lsp` → `./dist/lsp/index.js` (types `./dist/lsp/index.d.ts`)
    - `./core` → `./src/core/index.ts` (types `./dist/core/index.d.ts`)
    - `./automation` → `./src/automation/index.ts`
    - `./global` → `./dist/global/index.js`
  - `dependencies: { "@servicenow/sdk-cli": "4.5.0", "@servicenow/sdk-api": "4.5.0", "@servicenow/sdk-core": "4.5.0" }`
  - `optionalDependencies: { "undici": "6.19.8" }`
  - `engines: { node: ">=20.18.0", pnpm: ">=10.8.0" }`
  - `files: ["dist","src/core/index.ts","src/automation/index.ts","docs"]`

This confirms the umbrella’s role: publish binaries, unify sub-packages, and expose a multi-surface exports map with both Node and browser builds for `./api`.
