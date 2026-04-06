export default function Ch01({ CodeBlock, Callout }) {
  return (
    <div className="space-y-8">
      <Section title="Overview">
        <p>
          The <strong>ServiceNow Fluent SDK</strong> (<code>@servicenow/sdk</code>) is best treated as a
          metadata compiler and deployment orchestrator, not just a command-line utility. Your source
          files define application metadata (tables, Script Includes, REST APIs, flows, UI assets),
          and the SDK transforms that metadata into instance-ready artifacts.
        </p>
        <p className="mt-3">
          This chapter focuses on production-grade bootstrap patterns: deterministic project setup,
          hardened environment configuration, artifact inspection, and deployment diagnostics for a
          Personal Developer Instance (PDI).
        </p>
      </Section>

      <Section title="Execution model (what the SDK actually does)">
        <CodeBlock
          language="bash"
          filename="conceptual pipeline"
          showLineNumbers={false}
          code={`Your source code (Fluent DSL)
  ↓
Static analysis and metadata normalization
  ↓
Validation + dependency resolution
  ↓
Build artifacts in metadata/ (ServiceNow-compatible)
  ↓
Instance deployment via snc app install`}
        />
        <p className="text-sm mt-3" style={{ color: 'var(--color-text-muted)' }}>
          This distinction matters during debugging: runtime failures on instance and build-time
          validation errors are different classes of problems with different remediation paths.
        </p>
      </Section>

      <Section title="Prerequisites">
        <ul className="list-disc list-inside space-y-1 text-sm" style={{ color: 'var(--color-text-muted)' }}>
          <li>Node.js ≥ 22.0.0 (<code>node --version</code>)</li>
          <li>A free ServiceNow PDI — register at <strong>developer.servicenow.com</strong></li>
          <li>Instance credentials in <code>.env</code> (never commit them)</li>
          <li>CLI auth strategy chosen early (username/password vs OAuth pattern)</li>
        </ul>
        <Callout type="danger" title="🔒 Credentials">
          Copy <code>.env.example</code> → <code>.env</code> and fill in your PDI URL, username,
          and password. The <code>.env</code> file is in <code>.gitignore</code>. Treat it like a
          password file — never paste it into chat, issues, or CI logs.
        </Callout>
      </Section>

      <Section title="1 — Install and verify CLI surface area">
        <CodeBlock
          language="bash"
          filename="terminal"
          code={`# Install the ServiceNow SDK CLI globally
npm install -g @servicenow/sdk

# Verify installation
snc --version

# Inspect command groups and options
snc --help
snc app --help
snc ui-component --help`}
        />
        <p className="text-sm mt-3" style={{ color: 'var(--color-text-muted)' }}>
          Capture the output of <code>snc --version</code> in your project docs. When diagnosing build
          drift across machines, CLI version mismatch is often the first root cause.
        </p>
      </Section>

      <Section title="2 — Scaffold a deterministic project">
        <CodeBlock
          language="bash"
          filename="terminal"
          code={`# Create a new project directory
mkdir 01-hello-fluent && cd 01-hello-fluent

# Initialise a Fluent app
snc app init

# The CLI will prompt you for:
#   App name:    Hello Fluent
#   Scope:       x_learn_hello
#   Description: My first Fluent DSL app`}
        />
        <p className="text-sm mt-3" style={{ color: 'var(--color-text-muted)' }}>
          This creates the standard Fluent project structure:
        </p>
        <CodeBlock
          language="bash"
          filename="generated structure"
          showLineNumbers={false}
          code={`01-hello-fluent/
├── src/
│   └── x_learn_hello/         ← your app scope
│       └── app.config.js      ← app metadata
├── now.config.js              ← instance connection (reads from .env)
├── package.json
└── .snc/                      ← SDK build cache (git-ignored)`}
        />
        <CodeBlock
          language="json"
          filename="package.json (recommended scripts)"
          code={`{
  "scripts": {
    "build": "snc app build",
    "deploy": "snc app install",
    "watch": "snc app install --watch",
    "clean": "snc app clean"
  }
}`}
        />
      </Section>

      <Section title="3 — Harden instance configuration">
        <CodeBlock
          language="js"
          filename="now.config.js"
          code={`import 'dotenv/config'

function requireEnv(name) {
  const val = process.env[name]
  if (!val) throw new Error(\`Missing env var: \\${name} — copy .env.example -> .env and populate credentials\`)
  return val
}

export default {
  instance: {
    url: requireEnv('SN_INSTANCE_URL'),
    credentials: {
      username: requireEnv('SN_USERNAME'),
      password: requireEnv('SN_PASSWORD'),
    },
  },
}`}
        />
        <Callout type="info">
          The <code>requireEnv()</code> pattern fails fast with actionable errors. This prevents
          silent deploy attempts using undefined credentials and mirrors how other chapters in this
          repo configure secure instance access.
        </Callout>
      </Section>

      <Section title="4 — Build internals and artifact inspection">
        <CodeBlock
          language="bash"
          filename="terminal"
          code={`# Build the app (no network calls)
snc app build

# Inspect generated artifacts
ls -la metadata

# Optional: inspect generated XML payload shape
find metadata -name '*.xml' | head -n 5`}
        />
        <p className="text-sm mt-3" style={{ color: 'var(--color-text-muted)' }}>
          Treat <code>snc app build</code> as a compile step. If build succeeds but deployment fails,
          the issue is usually connection/auth/update-set lifecycle rather than DSL syntax.
        </p>
      </Section>

      <Section title="5 — Deploy lifecycle and watch mode">
        <CodeBlock
          language="bash"
          filename="terminal"
          code={`# Deploy compiled metadata to your PDI
snc app install

# Watch for changes and re-deploy automatically
snc app install --watch`}
        />
        <CodeBlock
          language="bash"
          filename="safe deployment sequence"
          showLineNumbers={false}
          code={`1) snc app clean       # optional cache cleanup
2) snc app build       # ensure deterministic artifacts
3) snc app install     # push artifacts to instance
4) validate in PDI     # verify app + records + scripts`}
        />
      </Section>

      <Section title="6 — Verify in your PDI (technical checks)">
        <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
          Validate more than app visibility:
        </p>
        <ul className="list-disc list-inside space-y-1 text-sm" style={{ color: 'var(--color-text-muted)' }}>
          <li>App exists under <strong>System Applications → My Company Applications</strong></li>
          <li>Scope matches expected prefix (<code>x_learn_hello</code>)</li>
          <li>No install-time errors in instance logs</li>
          <li>Metadata changed in expected records only (no unintended collisions)</li>
        </ul>
      </Section>

      <Section title="Troubleshooting matrix">
        <CodeBlock
          language="bash"
          filename="common failures"
          showLineNumbers={false}
          code={`Error: Missing env var SN_INSTANCE_URL
  → .env not present or variable name mismatch

Error: 401 / authentication failed during install
  → credential issue, locked user, wrong instance URL

Build passes but app not visible in expected scope
  → confirm app.config.js scope + deploy target instance

Watch mode loops or misses updates
  → run snc app clean, then restart watch process`}
        />
      </Section>

      <Section title="Key Takeaways">
        <ul className="list-disc list-inside space-y-1 text-sm" style={{ color: 'var(--color-text-muted)' }}>
          <li>Use the SDK as a compile/deploy pipeline, not just a command launcher</li>
          <li>Fail-fast env validation in <code>now.config.js</code> removes an entire class of deploy errors</li>
          <li>Separate build diagnostics from deploy diagnostics for faster root-cause analysis</li>
          <li>Versioned scripts and deterministic build steps make CI/CD adoption straightforward</li>
        </ul>
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
