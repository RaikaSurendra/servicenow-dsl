import sdkApi from './npm-knowledge/sdk.md?raw'

export default function Ch12({ CodeBlock, Callout }) {
  return (
    <div className="space-y-8">
      <Section title="Overview">
        <p>
          <code>@servicenow/sdk-api</code> is the programmatic engine of the ServiceNow SDK. It
          exposes the full build/pack/install/download/types lifecycle as a Node.js API. Every CLI
          command in <code>sdk-cli</code> calls into this layer. IDE extensions and CI pipelines can
          use it directly without the CLI.
        </p>
      </Section>

      <Section title="Public API Barrel (dist/index.d.ts)">
        <CodeBlock
          language="typescript"
          filename="dist/index.d.ts"
          showLineNumbers={false}
          code={`// Re-exports from @servicenow/sdk-build-core
export { Context, Plugin, Keys, Compiler, CompilerOptions, Logger,
         Package, File, TelemetryFactory, FileSystem, ts, tsc,
         Diagnostic, NowConfig } from '@servicenow/sdk-build-core'

// Own modules
export * from './project'           // Project, TransformResult
export * from './project-file'      // ProjectFile utilities
export * from './orchestrator'      // Orchestrator — lifecycle coordinator
export * from './project-factory'   // ProjectFactory, TemplateFile, Templates
export { Parser } from './context'  // Metadata parser
export * from './credentials'       // LazyCredential, Credential, OAuthCredential
export * from './connector'         // Connector, IConnector, UnloadedRecord
export { ApplicationDependencies } from './orchestrator/dependencies'`}
        />
      </Section>

      <Section title="Orchestrator — Core Methods">
        <CodeBlock
          language="typescript"
          filename="Orchestrator API"
          showLineNumbers={false}
          code={`// Lifecycle
build(options?: { frozenKeys?: boolean; sysIds?: string[] }): Promise<BuildResult>
pack(packagePath?: string): Promise<string>
install(options?: {
  clean?: boolean; packageZipPath?: string
  installAsStoreApp?: boolean; installAsync?: boolean
  demoData?: boolean; skipFlags?: Record<string, boolean>
}): Promise<void>
installStatus(): Promise<{ finished: boolean; id: string }>
clean(): void

// Sync with instance
download(options?: DownloadCompleteOptions | DownloadIncrementalOptions
                 | DownloadUpdateSetOptions | DownloadIDOptions): Promise<string>
transform(options?): Promise<TransformResult>
uploadXMLFiles(filePaths: string[], options?: { targetUpdateSetId?: string }): Promise<string>
moveToApp(options: { sysIds: string[] }): Promise<TransformResult | undefined>

// Type generation
types(options?: { downloadScripts?: boolean; downloadFluent?: boolean }): Promise<void>
addDependency(options: { table: string; ids: string[]; scope: string }): Promise<void>

// Scaffolding
applyTemplate(id: keyof Templates, params?: Record<string, string>): Promise<TemplateFile[]>
getDocsMetadata(): Promise<DocsManifest>`}
        />
      </Section>

      <Section title="Download Modes">
        <CodeBlock
          language="typescript"
          filename="DownloadOptions (discriminated union)"
          showLineNumbers={false}
          code={`type DownloadCompleteOptions    = { method: 'complete' }
type DownloadIncrementalOptions = { method: 'incremental'; lastPull?: string }
type DownloadUpdateSetOptions   = { method: 'update-set'; updateSetId: string; maxUpdateCount?: number }
type DownloadIDOptions          = { method: 'sys-id'; sysIds: string[] }
type DownloadMetadataOptions    = { method: 'metadata' } & (
  | { sysId: string; table: string }
  | { records: Array<{ sysId: string; table: string }> }
)`}
        />
      </Section>

      <Section title="IConnector — HTTP Interface">
        <CodeBlock
          language="typescript"
          filename="IConnector (all methods)"
          showLineNumbers={false}
          code={`interface IConnector {
  fetch(path: string, init?: RequestInit, params?: URLSearchParams): Promise<Response>
  download(scope: string, options?): Promise<Response>
  downloadUpdateSet(updateSetId: string, scopeId: string): Promise<Response>
  uploadScopedAppPackage(file: Blob, options: {
    timeoutMs?: number; loadDemoData?: boolean; isStoreApp?: boolean
    registerScope?: boolean; installAsync?: boolean
    appInfo?: { scope: string; scopeId: string; version: string }
  }): Promise<{ trackerId: string; rollbackId: string } | undefined>
  uploadXmlFiles(scope: string, files: { blob: Blob; name: string }[], options?): Promise<string>
  unloadRecords(sysIds: string[], scopeId: string): Promise<UnloadedRecord[]>
  unloadDependentRecords(request: UnloadRequest): Promise<UnloadedRecord[]>
  moveToApp(sysIds: string[], scope: string): Promise<CustomizeOrMoveResult[]>
  uninstallApplication(scopeId: string, isStoreApp: boolean): Promise<Response>
  appUpgradeStatus(scope: string): Promise<{ finished: boolean; id: string }>
  getProgress(progressId: string): Promise<{ status: string; percent_complete: number; status_message: string }>
  getScopeInfo(scope?, scopeId?): Promise<ScopeInfo | undefined>
  setCurrentApplication(scopeId: string): Promise<void>
  syntaxEditorCompletionDefinitions(): Promise<string>
  syntaxEditorCacheScriptIncludes(): Promise<Record<string, string>>
  syntaxEditorDefinitionsScriptIncludes(ids: string[]): Promise<Record<string, string>>
  processorRequest(api: string, search: URLSearchParams): Promise<{ status: number; value: string }>
  getHost(): URL
}`}
        />
      </Section>

      <Section title="Credentials">
        <CodeBlock
          language="typescript"
          filename="Auth types"
          showLineNumbers={false}
          code={`type UserTokenCredential = { token: string; cookie?: string; instanceUrl: URL }
type OAuthCredential    = { accessToken: string; instanceUrl: URL }
type Credential         = UserTokenCredential | OAuthCredential

// Defers auth resolution until first HTTP call
class LazyCredential {
  constructor(instanceUrl: URL, authResolver: () => Promise<ResolvedAuth>)
  getHeaders(): Promise<Record<string, string>>
  getSysParmCk(): Promise<string | undefined>
}`}
        />
        <Callout type="info" title="Why LazyCredential?">
          Auth may require an interactive keychain prompt or browser OIDC flow. Lazy resolution means
          the CLI can start up and validate project config before blocking on user input.
        </Callout>
      </Section>

      <Section title="Build + Deploy Sequence">
        <CodeBlock
          language="text"
          filename="orchestration flow"
          showLineNumbers={false}
          code={`Orchestrator.build()
  → sdk-build-core Compiler
      → sdk-build-plugins (each Plugin.run())
          → @servicenow/glide declarations for type checking
      → emit XML artifacts to appOutDir
  → save keys registry → BuildResultSuccess { packOutput }

Orchestrator.pack()
  → ZIP appOutDir → packOutputDir/{name_version}.zip

Orchestrator.install()
  → Connector.uploadScopedAppPackage(zip)
      → undici POST /api/now/app_store_mtx/package/app
  → poll Connector.appUpgradeStatus()
  → return when { finished: true }`}
        />
      </Section>

      <Section title="Full Reference Notes">
        <CodeBlock
          language="markdown"
          filename="npm-knowledge/sdk.md"
          showLineNumbers={false}
          code={sdkApi}
        />
      </Section>
    </div>
  )
}

function Section({ title, children }) {
  return (
    <section>
      <h2 className="text-lg font-semibold mb-3" style={{ color: 'var(--color-text-primary)' }}>{title}</h2>
      <div className="text-sm leading-relaxed space-y-2" style={{ color: 'var(--color-text-muted)' }}>
        {children}
      </div>
    </section>
  )
}
