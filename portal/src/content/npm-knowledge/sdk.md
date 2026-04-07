# Deep Dive: `@servicenow/sdk-api` (v4.5.0)

## What This Package Is

`@servicenow/sdk-api` is the **programmatic engine** of the ServiceNow SDK. It exposes the full build/package/install/download lifecycle as a Node.js API. Every CLI command in `sdk-cli` ultimately calls into this layer. IDE extensions and CI pipelines can also call it directly, bypassing the CLI entirely.

---

## Package Identity

| Field | Value |
|---|---|
| Name | `@servicenow/sdk-api` |
| Version | `4.5.0` |
| Main entry | `dist/index.js` |
| TypeScript declarations | `dist/index.d.ts` |
| Node.js required | `>= 20.18.0` |
| Package manager | `pnpm >= 10.8.0` |

---

## Public API Surface (`dist/index.d.ts`)

```ts
// Re-exports from @servicenow/sdk-build-core
export { Context, Plugin, Keys, Compiler, CompilerOptions, Logger,
         Package, File, TelemetryFactory, FileSystem, ts, tsc,
         Diagnostic, NowConfig } from '@servicenow/sdk-build-core'

// Own modules
export * from './project'              // Project, TransformResult
export * from './project-file'         // ProjectFile utilities
export * from './orchestrator'         // Orchestrator (lifecycle coordinator)
export * from './project-factory'      // ProjectFactory, TemplateFile, Templates
export { Parser }  from './context'    // Metadata parser
export * from './credentials'          // LazyCredential, Credential, OAuthCredential, UserTokenCredential
export * from './connector'            // Connector, IConnector, UnloadedRecord, BatchRecord
export { ApplicationDependencies } from './orchestrator/dependencies'
```

---

## `Orchestrator` — The Lifecycle Coordinator

`Orchestrator` is the central class. It takes a `Project` (local filesystem model) and optionally a `LazyCredential` or `IConnector` (for instance communication). It coordinates the entire app lifecycle.

### Constructor

```ts
class Orchestrator {
  constructor(
    project: Project,
    credentialOrConnector?: LazyCredential | IConnector
  )
}
```

### Core Methods

#### `build(options?)` — Compile

Invokes the plugin pipeline, generates output files, saves the keys registry.

```ts
build(options?: {
  frozenKeys?: boolean   // throw if key registry changed (CI guard)
  sysIds?: string[]      // build only specific records by sys_id
}): Promise<BuildResult>

type BuildResultSuccess = {
  success: true
  files: File[]
  packOutput: string   // path to the generated ZIP
  diagnostics: Diagnostic[]
}
type BuildResultError = {
  success: false
  diagnostics: Diagnostic[]
}
```

#### `pack(packagePath?)` — Create ZIP

Packages the build output into an installable ZIP archive.

```ts
pack(packagePath?: string): Promise<string>  // returns path to ZIP
```

#### `unpack(zipPath, targetPath)` — Extract ZIP

```ts
unpack(zipPath: string, targetPath: string): Promise<{ files: string[] }>
```

#### `install(options?)` — Deploy to Instance

Uploads and installs the app on the connected ServiceNow instance.

```ts
install(options?: {
  clean?: boolean                     // remove app first
  packageZipPath?: string             // use existing ZIP instead of packing
  installAsStoreApp?: boolean         // treat as a Store app install
  installAsync?: boolean              // don't wait for completion
  demoData?: boolean                  // load demo data
  skipFlags?: Record<string, boolean> // per-feature skip flags
}): Promise<void>
```

#### `installStatus()` — Poll Install Progress

```ts
installStatus(): Promise<{ finished: boolean; id: string }>
```

#### `download(options?, downloadPath?)` — Pull from Instance

Downloads the app from the ServiceNow instance. Four download modes:

```ts
type DownloadCompleteOptions     = { method: 'complete' }
type DownloadIncrementalOptions  = { method: 'incremental'; lastPull?: string }
type DownloadUpdateSetOptions    = { method: 'update-set'; updateSetId: string; maxUpdateCount?: number }
type DownloadIDOptions           = { method: 'sys-id'; sysIds: string[] }
type DownloadMetadataOptions     = { method: 'metadata' } & (
  | { sysId: string; table: string }
  | { records: Array<{ sysId: string; table: string }> }
)
```

#### `transform(options?)` — Convert Downloaded XML

Converts raw XML downloaded from the instance into project source format.

```ts
transform(options?: TransformPaths | DownloadOptions | TransformOptions): Promise<TransformResult>
```

#### `types(options?)` — Download TypeScript Definitions

Downloads type definitions from the instance — script definitions (`glide.*.d.ts`) and/or fluent types generated from `now.config.json`.

```ts
types(options?: {
  downloadScripts?: boolean   // download glide.*.d.ts  (default: true)
  downloadFluent?: boolean    // download now.config.json dependency types (default: true)
}): Promise<void>
```

#### `addDependency(options)` — Add Typed Dependencies

Fetches records from the instance, generates TypeScript types, and updates `now.config.json`.

```ts
addDependency(options: {
  table: string    // 'actions' | 'tables' | 'triggers' | 'subflows' | any table name
  ids: string[]    // sys_ids or table names; use ['*'] for all from a scope
  scope: string    // 'global' | 'x_my_app' | etc.
}): Promise<void>
```

Dependency config format in `now.config.json`:

```json
{
  "dependencies": {
    "global": {
      "tables": ["incident", "problem"],
      "automation": {
        "actions": ["action_sys_id_1"],
        "triggers": ["trigger_sys_id_1"],
        "subflows": ["subflow_sys_id_1"]
      }
    },
    "x_my_app": {
      "sys_security_acl": ["acl_sys_id_1"]
    }
  }
}
```

#### `moveToApp(options)` — Claim Global Records

Generates `sys_claim` records on the instance to move global records into the scoped app.

```ts
moveToApp(options: { sysIds: string[] }): Promise<TransformResult | undefined>
```

#### `uploadXMLFiles(filePaths, options?)` — Upload Raw XML

```ts
uploadXMLFiles(
  filePaths: string[],
  options?: { targetUpdateSetId?: string }
): Promise<string>
```

#### `applyTemplate(id, params?)` — Scaffold from Template

```ts
applyTemplate(id: keyof Templates, params?: Record<string, string>): Promise<TemplateFile[]>
```

#### `getDocsMetadata()` — Plugin API Documentation

```ts
getDocsMetadata(): Promise<DocsManifest>
```

#### `clean()` — Clear Build Output

```ts
clean(): void
```

---

## `IConnector` / `Connector` — HTTP Layer

`IConnector` is the interface that defines all HTTP communication with a ServiceNow instance. `Connector` implements it.

```ts
interface IConnector {
  fetch(path: string, init?: RequestInit, params?: URLSearchParams): Promise<Response>

  download(scope: string, options?: { method: 'complete' } | { method: 'incremental'; lastPull?: string }): Promise<Response>
  downloadUpdateSet(updateSetId: string, scopeId: string): Promise<Response>

  uploadScopedAppPackage(file: Blob, options: {
    timeoutMs?: number
    loadDemoData?: boolean
    isStoreApp?: boolean
    registerScope?: boolean
    installAsync?: boolean
    appInfo?: { scope: string; scopeId: string; version: string }
  }): Promise<{ trackerId: string; rollbackId: string } | undefined>

  uploadXmlFiles(scope: string, files: { blob: Blob; name: string }[], options?: {
    timeoutMs?: number
    targetUpdateSetId?: string
  }): Promise<string>

  unloadRecords(sysIds: string[], scopeId: string): Promise<UnloadedRecord[]>
  unloadDependentRecords(request: UnloadRequest): Promise<UnloadedRecord[]>
  moveToApp(sysIds: string[], scope: string): Promise<CustomizeOrMoveResult[]>
  uninstallApplication(scopeId: string, isStoreApp: boolean): Promise<Response>

  appUpgradeStatus(scope: string): Promise<{ finished: boolean; id: string }>
  getProgress(progressId: string): Promise<{ status: string; percent_complete: number; status_message: string }>
  getUpdateMutex(): Promise<boolean>
  getInstanceBuildName(): Promise<string | undefined>
  appCreatorVendorPrefix(): Promise<string>

  getScopeInfo(scope?: string, scopeId?: string): Promise<{
    appId: string; sysClassName: string; active: boolean
    scope: string; name: string; shortDescription: string
  } | undefined>

  setCurrentApplication(scopeId: string): Promise<void>

  syntaxEditorCompletionDefinitions(): Promise<string>
  syntaxEditorCacheScriptIncludes(): Promise<Record<string, string>>
  syntaxEditorDefinitionsScriptIncludes(scriptIncludeIds: string[]): Promise<Record<string, string>>

  processorRequest(api: string, search: URLSearchParams): Promise<{ status: number; value: string }>
  getUpdateXMLCount(updateSetId: string): Promise<number>
  getHost(): URL
}
```

**Key types:**

```ts
type UnloadedRecord = {
  content: string      // raw XML
  sysId: string
  table: string
  tableName: string
  name: string
}

type CustomizeOrMoveResult = { sysId: string; table: string }

type BatchRecord = { table: string; sysIds: string[]; graphIds: string[] }
type BatchUnloadRequest = {
  records: BatchRecord[]
  graphs: Record<string, RelationshipHierarchy<string>>
}
```

---

## Credentials — Auth Layer

```ts
// Basic auth (username:password encoded as Base64 token)
type UserTokenCredential = {
  token: string         // Base64 "user:password"
  cookie?: string
  instanceUrl: URL
}

// OAuth2 bearer token
type OAuthCredential = {
  accessToken: string
  instanceUrl: URL
}

type Credential = UserTokenCredential | OAuthCredential

// Lazy wrapper — resolves auth asynchronously (e.g. from keychain prompt)
class LazyCredential {
  constructor(instanceUrl: URL, authResolver: () => Promise<ResolvedAuth>)
  getHeaders(): Promise<Record<string, string>>
  getSysParmCk(): Promise<string | undefined>
}
```

`LazyCredential` defers auth resolution until the first HTTP call — enabling interactive login prompts without blocking startup.

---

## `ApplicationDependencies` — Type Generation Engine

Lives at `dist/orchestrator/dependencies/`. Coordinates between the instance and the local project to download and generate TypeScript type definitions.

```
ApplicationDependencies
├── ScriptDefinitionGenerator  → generates glide.*.d.ts for server APIs
├── FluentTypeGenerator        → generates TS types from now.config.json record data
├── FluentIndexBuilder         → maintains @types/servicenow-*/ index files
└── RelationshipResolver       → resolves record dependency graphs for batch unloading
```

The transactional model: records are fetched first, types generated, then `now.config.json` updated. If the fetch fails, the config is not updated — no partial state.

---

## `ProjectFactory` — Project Scaffolding

```ts
class ProjectFactory {
  createProject(workingDir: string, options: InitOptions): Promise<Project>
  createProjectFromApp(workingDir: string, scopeId: string, connector: IConnector, options?): Promise<Project>
  createConfigurationProject(workingDir: string, connector: IConnector, scopeOptions, options?): Promise<Project>
  createProjectFromDirectory(workingDir: string, metadataDir: string, options?): Promise<Project>

  getProjectTemplates(query?: string): Promise<Templates>
  getPartialTemplates(): Promise<Templates>
  getFullTemplates(): Promise<Templates>

  renderTemplates(templates: Templates, data: Record<string, string>, originalFiles: string[]): RenderedTemplateFile[]
  wouldTemplateConflict(templateContent: string, existingContent: string, newContent: string): boolean

  static createNpmPackageName(appName: string): string
}
```

`InitOptions` includes: `name`, `scope`, `packageName`, `description`, `sdkVersion`, `version`, `vendor`, `vendorPrefix`.

---

## Runtime Dependencies Explained

| Dependency | Version | Role |
|---|---|---|
| `@servicenow/sdk-build-core` | 4.5.0 | Compiler engine: `Plugin`, `Context`, `FileSystem`, `Logger` |
| `@servicenow/sdk-build-plugins` | 4.5.0 | Record transform and validation plugins |
| `@servicenow/isomorphic-rollup` | 1.2.15 | Universal module bundler (Node + browser builds) |
| `crypto-js` | 4.2.0 | Token hashing for credential management |
| `fast-json-stable-stringify` | 2.1.0 | Deterministic JSON for cache keys and build hashes |
| `fast-xml-parser` | 5.3.7 | Parses ServiceNow XML unload files |
| `handlebars` | 4.7.8 | Template rendering for `ProjectFactory.renderTemplates` |
| `lodash` | 4.17.23 | General utilities |
| `zod` | 3.23.8 | Runtime validation of `now.config.json` and API responses |

---

## Architecture Summary

```
@servicenow/sdk-api
│
├── Orchestrator            ← lifecycle coordinator
│   ├── Project             ← local filesystem + config model
│   ├── Connector           ← HTTP client (fetch/upload/download/install)
│   │   └── LazyCredential  ← deferred auth (basic/OAuth)
│   └── ApplicationDependencies
│       ├── ScriptDefinitionGenerator
│       ├── FluentTypeGenerator
│       ├── FluentIndexBuilder
│       └── RelationshipResolver
│
├── ProjectFactory          ← scaffolding + templates
│   └── templates (208 kB Handlebars templates embedded)
│
└── context/Parser          ← build context: parse / commit / keys / inspect
```

---

## Build + Deploy Sequence

```
Orchestrator.build()
  → sdk-build-core Compiler
      → sdk-build-plugins (each Plugin.run())
          → glide declarations for type checking
      → emit XML artifacts to appOutDir
  → save keys registry

Orchestrator.pack()
  → ZIP appOutDir → packOutputDir/{name_version}.zip

Orchestrator.install()
  → Connector.uploadScopedAppPackage(zip)
      → undici HTTP POST to /api/now/app_store_mtx/package/app
  → poll Connector.appUpgradeStatus()
  → return when finished: true
```

---

## Source References

- `docs/npm-packs/extract/servicenow-sdk-api-4.5.0/package/dist/`
- `https://www.npmjs.com/package/@servicenow/sdk-api`
