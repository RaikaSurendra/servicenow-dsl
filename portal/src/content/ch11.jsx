import sdkUmbrella from './npm-knowledge/sdk-umbrella.md?raw'

export default function Ch11({ CodeBlock, Callout }) {
  return (
    <div className="space-y-8">
      <Section title="Overview">
        <p>
          <code>@servicenow/sdk</code> is the single install target for the entire ServiceNow SDK ecosystem.
          It ships no build logic of its own — instead it pins exact versions of <code>sdk-cli</code>,{' '}
          <code>sdk-api</code>, and <code>sdk-core</code>, exposes CLI binaries, and provides a
          multi-surface exports map that routes each consumer to the right sub-package.
        </p>
      </Section>

      <Section title="The 7-Package Ecosystem">
        <CodeBlock
          language="text"
          filename="dependency tree"
          showLineNumbers={false}
          code={`@servicenow/sdk          ← you install this
├── sdk-cli              ← parses snc commands, manages UX / auth / logging
│   └── sdk-api          ← orchestrates build / pack / install / download / types
│       ├── sdk-build-plugins  ← plugin-driven metadata transforms + validation
│       │   ├── sdk-build-core ← compiler engine (Plugin, Context, FileSystem types)
│       │   ├── sdk-core       ← record schemas, table defs, flow types
│       │   └── glide          ← TypeScript declarations for 192 sn_* namespaces
│       └── sdk-core           ← (also directly consumed by sdk-api)
└── undici               ← HTTP transport for instance communication`}
        />
      </Section>

      <Section title="CLI Binaries">
        <CodeBlock
          language="json"
          filename="package.json (bin)"
          showLineNumbers={false}
          code={JSON.stringify({
            bin: {
              "now-sdk": "./bin/index.js",
              "now-sdk-debug": "./bin/debug.js",
              "@servicenow/sdk": "./bin/index.js"
            }
          }, null, 2)}
        />
        <p style={{ marginTop: 8 }}>
          All three entry points boot the same CLI dispatcher. <code>now-sdk-debug</code> enables
          verbose diagnostic output for troubleshooting builds and instance connections.
        </p>
      </Section>

      <Section title="Exports Map">
        <CodeBlock
          language="json"
          filename="package.json (exports)"
          showLineNumbers={false}
          code={JSON.stringify({
            "./api": { browser: "./dist/web/index.js", types: "./dist/api/index.d.ts", default: "./dist/api/index.js" },
            "./api/browser": { types: "./dist/api/index.d.ts", default: "./dist/web/index.js" },
            "./lsp": { types: "./dist/lsp/index.d.ts", default: "./dist/lsp/index.js" },
            "./core": { types: "./dist/core/index.d.ts", default: "./src/core/index.ts" },
            "./automation": "./src/automation/index.ts",
            "./global": "./dist/global/index.js"
          }, null, 2)}
        />
        <Callout type="info" title="Why two API builds?">
          <code>./api</code> → Node.js (full Orchestrator, Connector, file system access).
          <br /><code>./api/browser</code> → browser-compatible bundle (no Node built-ins) for IDE plugins running in a web context.
        </Callout>
      </Section>

      <Section title="How a snc build Traverses All Layers">
        <CodeBlock
          language="text"
          filename="call flow"
          showLineNumbers={false}
          code={`snc build --install

1. bin/index.js           → boots sdk-cli
2. sdk-cli/command/build  → parses --install flag, validates project path
3. sdk-api/Orchestrator   → build() called
4. sdk-build-plugins      → each Plugin runs: parse XML → validate → emit files
   └── @servicenow/glide  → declarations type-check your server scripts
5. sdk-api/Orchestrator   → pack() → creates app.zip
6. sdk-api/Orchestrator   → install() called
7. sdk-api/Connector      → uploadScopedAppPackage() → undici HTTP POST
8. ServiceNow instance    → installs and runs the app
9. sdk-cli                → logs status + exits 0`}
        />
      </Section>

      <Section title="Full Reference Notes">
        <CodeBlock
          language="markdown"
          filename="npm-knowledge/sdk-umbrella.md"
          showLineNumbers={false}
          code={sdkUmbrella}
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
