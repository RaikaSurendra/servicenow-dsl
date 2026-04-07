# Deep Dive: `@servicenow/sdk` (v4.5.0) — The Umbrella Package

## What the Umbrella Does

`@servicenow/sdk` is the single install target for the entire ServiceNow SDK ecosystem. It does not implement any build logic itself — it is a **composition package** that:

1. Pins exact versions of three primary SDK layers
2. Exposes CLI binaries
3. Provides a multi-surface exports map that routes consumers to the right sub-package

Running `npm install @servicenow/sdk` pulls down seven coordinated packages. Without this umbrella, teams would manually track version compatibility across `sdk-cli`, `sdk-api`, `sdk-core`, and their transitive dependencies.

---

## Package Identity

| Field | Value |
|---|---|
| Name | `@servicenow/sdk` |
| Version | `4.5.0` |
| License | MIT |
| Node.js required | `>= 20.18.0` |
| Package manager | `pnpm >= 10.8.0` |
| Files shipped | `dist/`, `src/core/index.ts`, `src/automation/index.ts`, `docs/` |

---

## CLI Binaries

The umbrella registers three CLI entry points:

```json
{
  "bin": {
    "now-sdk":        "./bin/index.js",
    "now-sdk-debug":  "./bin/debug.js",
    "@servicenow/sdk": "./bin/index.js"
  }
}
```

All three point to the same CLI dispatcher (`bin/index.js`), which delegates to `@servicenow/sdk-cli`. The `now-sdk-debug` variant enables verbose diagnostic output for troubleshooting builds and connections.

---

## Exports Map

The umbrella's exports surface routes different consumers to different sub-package builds:

```json
{
  "exports": {
    "./api": {
      "browser": "./dist/web/index.js",
      "types":   "./dist/api/index.d.ts",
      "default": "./dist/api/index.js"
    },
    "./api/browser": {
      "types":   "./dist/api/index.d.ts",
      "default": "./dist/web/index.js"
    },
    "./lsp": {
      "types":   "./dist/lsp/index.d.ts",
      "default": "./dist/lsp/index.js"
    },
    "./core": {
      "types":   "./dist/core/index.d.ts",
      "default": "./src/core/index.ts"
    },
    "./automation": "./src/automation/index.ts",
    "./global":     "./dist/global/index.js"
  }
}
```

| Entry point | Who uses it | What it provides |
|---|---|---|
| `./api` | Node.js tooling, CI, IDE extensions | Full `Orchestrator`, `Connector`, `ProjectFactory` API |
| `./api/browser` | Browser-based IDE plugins | Same API shapes, browser-compatible bundled build |
| `./lsp` | Language Server Protocol integrations | LSP-aware type resolution for editor plugins |
| `./core` | Internal SDK consumers | Raw source TypeScript (not pre-compiled) |
| `./automation` | Test automation tools | Automation scripting helpers |
| `./global` | Runtime environment setup | Global scope type augmentation |

---

## Dependency Graph

```
@servicenow/sdk (4.5.0)
├── dependencies (pinned exact)
│   ├── @servicenow/sdk-cli   4.5.0   ← CLI commands and UX
│   ├── @servicenow/sdk-api   4.5.0   ← Orchestrator, Connector, ProjectFactory
│   └── @servicenow/sdk-core  4.5.0   ← Shared schemas and metadata contracts
└── optionalDependencies
    └── undici  6.19.8                 ← HTTP transport (optional — uses Node built-in fetch if absent)
```

`@servicenow/sdk-build-plugins` and `@servicenow/glide` are **transitive** — they are pulled in as dependencies of `sdk-api` and `sdk-build-plugins` respectively, not listed here directly.

---

## The Full Ecosystem (all 7 packages)

```
@servicenow/sdk          ← You install this
├── sdk-cli              ← Parses snc commands, manages UX/auth/logging
│   └── sdk-api          ← Orchestrates build/pack/install/download/types
│       ├── sdk-build-plugins  ← Plugin-driven metadata transforms and validation
│       │   ├── sdk-build-core ← Compiler engine (Plugin, Context, FileSystem types)
│       │   ├── sdk-core       ← Record schemas, table definitions, flow types
│       │   └── glide          ← TypeScript declarations for 192 sn_* namespaces
│       └── sdk-core           ← (also directly consumed by sdk-api)
└── undici               ← HTTP transport for instance communication
```

---

## How a `snc build` Call Traverses All Layers

```
Developer runs: snc build --install

1. bin/index.js           → boots sdk-cli
2. sdk-cli/command/build  → parses --install flag, validates project path
3. sdk-api/Orchestrator   → build() called
4. sdk-build-plugins      → each Plugin runs: parse XML → validate → emit files
   └── @servicenow/glide  → declarations used to type-check server scripts
5. sdk-api/Orchestrator   → pack() → creates app.zip
6. sdk-api/Orchestrator   → install() called (because --install flag)
7. sdk-api/Connector      → uploadScopedAppPackage() → undici HTTP call
8. ServiceNow instance    → installs and runs app
9. sdk-cli                → logs status + exits 0
```

---

## Why This Layer Exists

Without the umbrella:
- Teams must manually align `sdk-cli@4.5.0` + `sdk-api@4.5.0` + `sdk-core@4.5.0` — any mismatch causes subtle build failures
- `sdk-api` and `sdk-cli` cross-import internal types — version skew between them breaks TypeScript compilation
- CI pipelines need a single install target, not 3+ coordinated installs

The umbrella enforces a known-good composition. If you need `sdk-cli@4.5.0`, you get exactly the `sdk-api` and `sdk-core` it was tested with.

---

## Source References

- `docs/npm-packs/extract/servicenow-sdk-4.5.0/package/`
- `https://www.npmjs.com/package/@servicenow/sdk`
