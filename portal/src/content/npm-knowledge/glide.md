# Deep Dive: `@servicenow/glide` (v27.0.5)

`@servicenow/glide` is the typed contract package for Glide Scriptable APIs. It provides declaration files consumed by tooling and TypeScript-aware editors to model server-side ServiceNow APIs.

## Evidence Source (`npm pack`)

Captured from `npm pack @servicenow/glide` (tarball: `servicenow-glide-27.0.5.tgz`):

- Name/version: `@servicenow/glide@27.0.5`
- Description: `Contains type declaration for Glide Scriptable APIs`
- Types entry: `./src/index.d.ts`
- Engines: `node >=20.18.0`
- Runtime dependencies: `0`
- Export keys: `.`, `./*`, `./util`
- Tarball layout: `src/` dominates (1,658 entries)

## Functioning Model

```mermaid
flowchart LR
  G[@servicenow/glide d.ts contracts] --> P[@servicenow/sdk-build-plugins]
  G --> A[@servicenow/sdk-api types workflow]
  P --> IDE[Editor intellisense + compile-time checks]
  A --> IDE
```

## Why It Matters

- This package is mostly declarations, not runtime logic.
- Its independent versioning (`27.0.5`) reflects API surface cadence rather than SDK umbrella cadence.
- Large declaration surface indicates broad coverage of platform scriptables.

## Source References

- `https://www.npmjs.com/package/@servicenow/glide`
- `npm pack @servicenow/glide`

## Tarball Evidence (from docs/npm-packs/extract)

- package.json highlights (servicenow-glide-27.0.5/package/package.json):
  - `name: @servicenow/glide`
  - `version: 27.0.5`
  - `types: ./src/index.d.ts`
  - `files: ["src", "!src/util/index.ts"]`
  - `exports: { ".": "./src/types/index.js", "./*": "./src/*/index.js", "./util": "./src/util/index.js" }`
  - `engines.node: ">=20.18.0"`
  - dev-only toolchain: `ts-morph`, `ctix`, `typescript`, `tsx`, `jest`

The presence of only `.d.ts` type declarations in `src/` and the export map confirm zero runtime JavaScript — this package purely provides TypeScript ambient contracts for Glide APIs.
