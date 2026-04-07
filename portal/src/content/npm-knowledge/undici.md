# Deep Dive: `undici` (v8.0.2)

## What This Package Is

`undici` is a **from-scratch HTTP/1.1 client for Node.js**, written and maintained by the Node.js core team. In the ServiceNow SDK, it is the transport layer that `@servicenow/sdk-api`'s `Connector` class uses for all HTTP communication with ServiceNow instances — uploading apps, downloading XML, checking install progress, and fetching type definitions.

The name "undici" is Italian for "eleven" — as in HTTP/1.1.

---

## Package Identity

| Field | Value |
|---|---|
| Name | `undici` |
| Version | `8.0.2` |
| Description | `An HTTP/1.1 client, written from scratch for Node.js` |
| Homepage | `https://undici.nodejs.org` |
| Repository | `nodejs/undici` (part of the Node.js org) |
| Main | `index.js` |
| Types | `index.d.ts` |
| Runtime dependencies | **0** |
| Node.js required | `>= 22.19.0` |

**Important version note:** The ServiceNow SDK umbrella (`@servicenow/sdk`) optionally depends on `undici@6.19.8`, not 8.0.2. Version 8.0.2 is the standalone current release. The behavior described here covers the 8.x API which is substantially the same as 6.x for SDK use cases.

---

## Why undici Instead of `node-fetch` or `axios`?

| Concern | undici advantage |
|---|---|
| **Connection pooling** | Built-in `Pool` and `BalancedPool` — reuses TCP connections across requests |
| **HTTP/1.1 pipelining** | Sends multiple requests before responses arrive |
| **Zero dependencies** | No transitive risk |
| **Fetch-compatible API** | Matches the browser `fetch()` spec — no API translation needed |
| **Node.js native** | Used internally by Node.js `fetch` — same codebase |
| **TypeScript-first** | Ships a dedicated `types/` directory, not bolted-on `@types/*` |
| **Streaming** | First-class `stream` API for large payloads (app ZIP uploads) |

---

## Full Public API (`types/index.d.ts`)

### Core Classes

```ts
// Low-level: one connection, one host
class Client extends Dispatcher {
  constructor(url: URL | string, options?: Client.Options)
  connect(options, callback?): void
  dispatch(options, handler): boolean
  pipeline(options, handler): Duplex
  request(options): Promise<ResponseData>
  stream(options, factory): Promise<StreamData>
  upgrade(options): Promise<UpgradeData>
  close(): Promise<void>
  destroy(err?): Promise<void>
}

// Connection pool: multiple connections to one host
class Pool extends Dispatcher {
  constructor(url: URL | string, options?: Pool.Options)
  // same interface as Client + pool management
}

// Distributes across multiple pools (multi-origin load balancing)
class BalancedPool extends Dispatcher {
  constructor(url: string | string[], options?: Pool.Options)
  addUpstream(upstream: string): this
  removeUpstream(upstream: string): this
  get upstreams(): string[]
}

// Round-robin across multiple origins
class RoundRobinPool extends Dispatcher {}

// Manages multiple pools, one per origin
class Agent extends Dispatcher {
  constructor(options?: Agent.Options)
  // dispatches requests to the correct pool per origin
}
```

### Top-Level Request Functions

```ts
// Convenience wrappers — use the global Agent
function request(
  url: string | URL | UrlObject,
  options?: RequestOptions
): Promise<ResponseData>

function stream(
  url: string | URL | UrlObject,
  options: RequestOptions,
  factory: (data: StreamFactoryData) => Writable
): Promise<StreamData>

function pipeline(
  url: string | URL | UrlObject,
  options: RequestOptions,
  handler: (data: PipelineHandlerData) => Readable
): Duplex

function connect(url: string | URL | UrlObject, options?: ConnectOptions): Promise<ConnectData>
function upgrade(url: string | URL | UrlObject, options?: UpgradeOptions): Promise<UpgradeData>
```

### Fetch-Compatible API

```ts
// Browser-spec fetch — works exactly like window.fetch
function fetch(input: RequestInfo, init?: RequestInit): Promise<Response>

class Headers extends globalThis.Headers {}
class Request extends globalThis.Request {}
class Response extends globalThis.Response {}
class FormData extends globalThis.FormData {}

// Cache API
const caches: CacheStorage

// EventSource (SSE)
class EventSource // from './eventsource'

// WebSocket
class WebSocket  // from './websocket'
```

### Global Dispatcher Management

```ts
function setGlobalDispatcher(dispatcher: Dispatcher): void
function getGlobalDispatcher(): Dispatcher

// Set a base origin for relative URL resolution
function setGlobalOrigin(origin: string | URL | undefined): void
function getGlobalOrigin(): URL | undefined
```

### Proxy and Tunnel Support

```ts
class ProxyAgent extends Dispatcher {
  constructor(options: ProxyAgent.Options | string)
}

class Socks5ProxyAgent extends Dispatcher {
  constructor(uri: string | URL, options?: object)
}

class EnvHttpProxyAgent extends Dispatcher {
  // reads HTTP_PROXY / HTTPS_PROXY / NO_PROXY environment variables
}
```

### Caching

```ts
class CacheInterceptor {
  static MemoryCacheStore: typeof MemoryCacheStore   // in-process memory cache
  static SqliteCacheStore: typeof SqliteCacheStore   // SQLite-backed persistent cache
}

const cacheStores: {
  MemoryCacheStore: typeof CacheInterceptor.MemoryCacheStore
  SqliteCacheStore: typeof CacheInterceptor.SqliteCacheStore
}
```

### Retry and Resilience

```ts
class RetryHandler extends Dispatcher.RedirectHandler {
  constructor(options: RetryHandler.RetryOptions, handlers: RetryHandler.RetryHandlers)
}

class RetryAgent extends Dispatcher {
  constructor(dispatcher: Dispatcher, options?: RetryHandler.RetryOptions)
}
```

### Interceptors

```ts
const interceptors: {
  cache(options?: CacheInterceptor.CacheOptions): Dispatcher.DispatchInterceptor
  dump(options?: Dump.DumpOptions): Dispatcher.DispatchInterceptor
  redirect(options?: RedirectOptions): Dispatcher.DispatchInterceptor
  retry(options?: RetryHandler.RetryOptions): Dispatcher.DispatchInterceptor
  responseError(): Dispatcher.DispatchInterceptor
}
```

Interceptors are composable middleware applied to a `Dispatcher`. Stack them for retry + cache + redirect handling.

### Mock API (for Testing)

```ts
class MockAgent extends Dispatcher {
  constructor(options?: MockAgent.Options)
  get(origin: string | RegExp): MockPool | MockClient
  close(): Promise<void>
  activate(): void
  deactivate(): void
  enableNetConnect(host?: string | RegExp): void
  disableNetConnect(host?: string | RegExp): void
}

class MockPool extends Dispatcher {
  intercept(options: MockInterceptor.Options): MockInterceptor
}

class MockClient extends Dispatcher {
  intercept(options: MockInterceptor.Options): MockInterceptor
}

class MockCallHistory {
  // inspect all calls made through mock interceptors
  calls(): MockCallHistoryLog[]
}

class SnapshotAgent extends Dispatcher {
  // record real responses, replay them in tests
}
```

### Other Exports

```ts
// HTTP/2 cleartext (h2c) client
class H2CClient extends Dispatcher {}

// Wrap a Dispatcher with the old-style Dispatcher v1 interface
class Dispatcher1Wrapper {}

// Custom connector (TLS/TCP level)
function buildConnector(options?: buildConnector.BuildOptions): buildConnector.connector

// Error types
const errors: {
  UndiciError: typeof UndiciError
  ConnectTimeoutError: typeof ConnectTimeoutError
  HeadersTimeoutError: typeof HeadersTimeoutError
  BodyTimeoutError: typeof BodyTimeoutError
  ResponseStatusCodeError: typeof ResponseStatusCodeError
  InvalidArgumentError: typeof InvalidArgumentError
  RequestAbortedError: typeof RequestAbortedError
  SocketError: typeof SocketError
  // ...
}

// Cookies (RFC 6265)
// from './cookies'

// Diagnostics channel integration
// from './diagnostics-channel'

// Content-Type parsing
// from './content-type'

// Global install (patches globalThis.fetch, Headers, etc.)
function install(): void
```

---

## How `sdk-api` Uses undici

The `Connector` class in `@servicenow/sdk-api` uses undici (via Node.js's built-in `fetch`, which is itself backed by undici) or directly imports it for pooled connections:

```
Connector.uploadScopedAppPackage(zip: Blob)
  → undici Pool (connection pool to instance URL)
  → HTTP POST /api/now/app_store_mtx/package/app
      Content-Type: multipart/form-data
      Authorization: Bearer <token>
      Body: app.zip (streamed)
  ← { trackerId, rollbackId }

Connector.download(scope, { method: 'complete' })
  → undici fetch GET /api/now/export/xml?sysparm_query=...
  ← Response stream → written to temp file → returned as Response

Connector.appUpgradeStatus(scope)
  → undici fetch GET /api/now/app_store_mtx/install_status
  ← { finished: boolean, id: string }
```

Connection pooling matters because an install sequence may involve dozens of sequential HTTP calls (upload → poll status × N → confirm). A pool keeps the TCP connection warm across all polls.

---

## Types Directory Structure (`types/`)

```
types/
├── index.d.ts          ← master barrel (all exports)
├── dispatcher.d.ts     ← Dispatcher base class + interfaces
├── client.d.ts         ← Client options and internals
├── pool.d.ts           ← Pool options and stats
├── pool-stats.d.ts     ← PoolStats shape
├── client-stats.d.ts   ← ClientStats shape
├── agent.d.ts          ← Agent options
├── balanced-pool.d.ts  ← BalancedPool
├── round-robin-pool.d.ts
├── fetch.d.ts          ← fetch(), Headers, Request, Response
├── formdata.d.ts       ← FormData
├── websocket.d.ts      ← WebSocket
├── eventsource.d.ts    ← EventSource (SSE)
├── cache.d.ts          ← CacheStorage
├── cache-interceptor.d.ts ← MemoryCacheStore, SqliteCacheStore
├── interceptors.d.ts   ← cache/dump/redirect/retry interceptors
├── mock-agent.d.ts     ← MockAgent
├── mock-pool.d.ts      ← MockPool
├── mock-client.d.ts    ← MockClient
├── mock-interceptor.d.ts ← intercept() API
├── mock-call-history.d.ts ← call inspection
├── snapshot-agent.d.ts ← record/replay
├── proxy-agent.d.ts    ← HTTP proxy
├── socks5-proxy-agent.d.ts ← SOCKS5 proxy
├── env-http-proxy-agent.d.ts ← ENV-based proxy
├── retry-handler.d.ts  ← RetryHandler options
├── retry-agent.d.ts    ← RetryAgent
├── errors.d.ts         ← all error types
├── connector.d.ts      ← TLS/TCP connector
├── diagnostics-channel.d.ts ← Node.js diagnostics_channel integration
├── cookies.d.ts        ← Cookie parsing
├── content-type.d.ts   ← Content-Type header parsing
├── api.d.ts            ← request/stream/pipeline/connect/upgrade
├── handlers.d.ts       ← RedirectHandler, DecoratorHandler
├── readable.d.ts       ← Readable body types
├── util.d.ts           ← utility types
├── utility.d.ts        ← shared helper types
└── header.d.ts         ← header types
```

---

## Architecture in the SDK Context

```
ServiceNow SDK HTTP call path:

snc install
  → sdk-cli/command/install/handler
  → sdk-api/Orchestrator.install()
  → sdk-api/Connector.uploadScopedAppPackage()
      → undici Pool (persistent TCP to instance)
          → HTTP/1.1 POST with multipart body
          ← 200 { trackerId, rollbackId }
  → poll Connector.appUpgradeStatus()
      → undici fetch GET (reuses pooled connection)
          ← { finished: false, id }
  → poll again (× N)
      ← { finished: true, id }
  → sdk-cli logs "Install complete"
```

---

## Source References

- `docs/npm-packs/extract/undici-8.0.2/package/types/`
- `docs/npm-packs/extract/undici-8.0.2/package/types/index.d.ts`
- `https://undici.nodejs.org`
- `https://www.npmjs.com/package/undici`
- `https://github.com/nodejs/undici`
