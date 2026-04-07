import undici from './npm-knowledge/undici.md?raw'

export default function Ch17({ CodeBlock, Callout }) {
  return (
    <div className="space-y-8">
      <Section title="Overview">
        <p>
          <code>undici</code> is a from-scratch HTTP/1.1 client for Node.js, written and maintained
          by the Node.js core team. In the ServiceNow SDK, it is the transport layer that
          <code>@servicenow/sdk-api</code>'s <code>Connector</code> class uses for all HTTP
          communication with ServiceNow instances — uploading apps, downloading XML, polling
          install progress, and fetching type definitions.
        </p>
        <Callout type="info" title="Name origin">
          "Undici" is Italian for eleven — as in HTTP/1.1. It is also the library used
          internally by Node.js's built-in <code>fetch()</code>.
        </Callout>
      </Section>

      <Section title="Why undici vs node-fetch or axios?">
        <CodeBlock
          language="text"
          filename="undici advantages"
          showLineNumbers={false}
          code={`Connection pooling  → built-in Pool + BalancedPool — reuses TCP connections
HTTP/1.1 pipelining → multiple requests in-flight before responses arrive
Zero dependencies   → no transitive risk from third-party packages
Fetch-compatible    → matches browser fetch() spec — no API translation
Node.js native      → same codebase used by Node.js built-in fetch()
TypeScript-first    → ships a dedicated types/ directory (46 .d.ts files)
Streaming           → first-class stream API for large app ZIP uploads`}
        />
      </Section>

      <Section title="Core Class Hierarchy">
        <CodeBlock
          language="typescript"
          filename="types/index.d.ts (core classes)"
          showLineNumbers={false}
          code={`// One connection to one host — lowest level
class Client extends Dispatcher {
  constructor(url: URL | string, options?: Client.Options)
  request(options: RequestOptions): Promise<ResponseData>
  stream(options, factory): Promise<StreamData>
  pipeline(options, handler): Duplex
  close(): Promise<void>
  destroy(err?): Promise<void>
}

// Multiple connections to one host — pooling
class Pool extends Dispatcher {
  constructor(url: URL | string, options?: Pool.Options)
  // same interface as Client
}

// Distributes across multiple pools (multi-origin load balancing)
class BalancedPool extends Dispatcher {
  addUpstream(upstream: string): this
  removeUpstream(upstream: string): this
  get upstreams(): string[]
}

// Round-robin across multiple origins
class RoundRobinPool extends Dispatcher {}

// Manages multiple pools, one per origin
class Agent extends Dispatcher {
  constructor(options?: Agent.Options)
}`}
        />
      </Section>

      <Section title="Top-Level Request Functions">
        <CodeBlock
          language="typescript"
          filename="convenience wrappers"
          showLineNumbers={false}
          code={`// Use the global Agent — no manual pool management needed
function request(url: string | URL, options?: RequestOptions): Promise<ResponseData>
function stream(url: string | URL, options: RequestOptions, factory: Factory): Promise<StreamData>
function pipeline(url: string | URL, options: RequestOptions, handler: Handler): Duplex
function connect(url: string | URL, options?: ConnectOptions): Promise<ConnectData>
function upgrade(url: string | URL, options?: UpgradeOptions): Promise<UpgradeData>

// Global dispatcher (used by top-level functions)
function setGlobalDispatcher(dispatcher: Dispatcher): void
function getGlobalDispatcher(): Dispatcher
function setGlobalOrigin(origin: string | URL | undefined): void
function getGlobalOrigin(): URL | undefined`}
        />
      </Section>

      <Section title="Fetch-Compatible API">
        <CodeBlock
          language="typescript"
          filename="Web-spec fetch in Node.js"
          showLineNumbers={false}
          code={`// Browser-spec fetch — same API as window.fetch
function fetch(input: RequestInfo, init?: RequestInit): Promise<Response>

class Headers extends globalThis.Headers {}
class Request extends globalThis.Request {}
class Response extends globalThis.Response {}
class FormData extends globalThis.FormData {}

// Cache API (browser-compatible)
const caches: CacheStorage

// EventSource (Server-Sent Events)
class EventSource

// WebSocket
class WebSocket

// Installs undici as globalThis.fetch, Headers, Response, Request
function install(): void`}
        />
      </Section>

      <Section title="Proxy + Resilience">
        <CodeBlock
          language="typescript"
          filename="proxy and retry classes"
          showLineNumbers={false}
          code={`// HTTP proxy (CONNECT tunnel)
class ProxyAgent extends Dispatcher {
  constructor(options: ProxyAgent.Options | string)
}

// SOCKS5 proxy
class Socks5ProxyAgent extends Dispatcher {}

// Reads HTTP_PROXY / HTTPS_PROXY / NO_PROXY env vars
class EnvHttpProxyAgent extends Dispatcher {}

// Retry with backoff
class RetryAgent extends Dispatcher {
  constructor(dispatcher: Dispatcher, options?: RetryHandler.RetryOptions)
}

// Composable interceptors
const interceptors: {
  cache(options?): Dispatcher.DispatchInterceptor
  retry(options?): Dispatcher.DispatchInterceptor
  redirect(options?): Dispatcher.DispatchInterceptor
  dump(options?): Dispatcher.DispatchInterceptor
  responseError(): Dispatcher.DispatchInterceptor
}

// Caching backends
const cacheStores: {
  MemoryCacheStore: typeof CacheInterceptor.MemoryCacheStore   // in-process
  SqliteCacheStore: typeof CacheInterceptor.SqliteCacheStore   // persistent
}`}
        />
      </Section>

      <Section title="Mock API (for Testing)">
        <CodeBlock
          language="typescript"
          filename="MockAgent pattern"
          showLineNumbers={false}
          code={`const mockAgent = new MockAgent()
setGlobalDispatcher(mockAgent)
mockAgent.disableNetConnect()  // no real HTTP

const mockPool = mockAgent.get('https://my-instance.service-now.com')

// Intercept a specific request
mockPool.intercept({
  path: '/api/now/app_store_mtx/package/app',
  method: 'POST'
}).reply(200, { trackerId: 'abc123', rollbackId: 'xyz789' })

// Inspect call history
const history: MockCallHistoryLog[] = mockAgent.calls()

// Record real responses and replay in CI
const snapshot = new SnapshotAgent(realAgent, { snapshotPath: './fixtures' })`}
        />
      </Section>

      <Section title="How sdk-api Uses undici">
        <CodeBlock
          language="text"
          filename="SDK HTTP call path"
          showLineNumbers={false}
          code={`snc install
  → sdk-cli/command/install/handler
  → sdk-api/Orchestrator.install()
  → sdk-api/Connector.uploadScopedAppPackage(zip: Blob)
      → undici Pool (persistent TCP to instance URL)
          → HTTP/1.1 POST /api/now/app_store_mtx/package/app
              Content-Type: multipart/form-data
              Authorization: Bearer <token>
              Body: app.zip streamed via undici.stream()
          ← 200 { trackerId, rollbackId }
  → poll Connector.appUpgradeStatus()
      → undici fetch GET /api/now/app_store_mtx/install_status
          ← { finished: false, id }  (reuses pooled TCP connection)
  → poll again × N
      ← { finished: true, id }
  → sdk-cli logs "Install complete"`}
        />
        <Callout type="tip" title="Why pooling matters for installs">
          An install sequence involves dozens of sequential HTTP calls. Connection pooling keeps
          the TCP connection warm across all polls, avoiding repeated TLS handshakes and cutting
          total install latency significantly on slow or high-latency connections.
        </Callout>
      </Section>

      <Section title="Types Directory (46 .d.ts files)">
        <CodeBlock
          language="text"
          filename="types/ layout"
          showLineNumbers={false}
          code={`types/
├── index.d.ts               ← master barrel (all exports)
├── dispatcher.d.ts          ← Dispatcher base class + DispatchInterceptor
├── client.d.ts              ← Client, Client.Options, Client.Stats
├── pool.d.ts                ← Pool, Pool.Options, Pool.Stats
├── agent.d.ts               ← Agent, Agent.Options
├── balanced-pool.d.ts       ← BalancedPool
├── round-robin-pool.d.ts    ← RoundRobinPool
├── fetch.d.ts               ← fetch(), Headers, Request, Response
├── formdata.d.ts            ← FormData
├── websocket.d.ts           ← WebSocket
├── eventsource.d.ts         ← EventSource (SSE)
├── cache.d.ts               ← CacheStorage, Cache
├── cache-interceptor.d.ts   ← MemoryCacheStore, SqliteCacheStore
├── interceptors.d.ts        ← cache/dump/redirect/retry interceptors
├── mock-agent.d.ts          ← MockAgent
├── mock-pool.d.ts           ← MockPool + MockInterceptor
├── mock-client.d.ts         ← MockClient
├── mock-call-history.d.ts   ← MockCallHistory, MockCallHistoryLog
├── snapshot-agent.d.ts      ← SnapshotAgent (record/replay)
├── proxy-agent.d.ts         ← ProxyAgent
├── socks5-proxy-agent.d.ts  ← Socks5ProxyAgent
├── env-http-proxy-agent.d.ts ← EnvHttpProxyAgent
├── retry-handler.d.ts       ← RetryHandler, RetryOptions
├── retry-agent.d.ts         ← RetryAgent
├── errors.d.ts              ← all error types (UndiciError, TimeoutError, ...)
├── connector.d.ts           ← buildConnector (TLS/TCP level)
├── diagnostics-channel.d.ts ← Node.js diagnostics_channel integration
├── cookies.d.ts             ← Cookie parsing (RFC 6265)
├── content-type.d.ts        ← Content-Type header parsing
├── api.d.ts                 ← request/stream/pipeline/connect/upgrade
├── handlers.d.ts            ← RedirectHandler, DecoratorHandler
├── readable.d.ts            ← Readable body types
└── ... (14 more)`}
        />
      </Section>

      <Section title="Full Reference Notes">
        <CodeBlock
          language="markdown"
          filename="npm-knowledge/undici.md"
          showLineNumbers={false}
          code={undici}
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
