export default function Ch01({ CodeBlock, Callout }) {
  return (
    <div className="space-y-8">
      <Section title="Overview">
        <p>
          The <strong>ServiceNow Fluent SDK</strong> (<code>@servicenow/sdk</code>) lets you author
          ServiceNow applications as code — tables, Script Includes, REST APIs, UI components and
          workflow metadata all live in your editor and source control rather than scattered across
          the platform UI.
        </p>
        <p className="mt-3">
          In this chapter you will install the SDK CLI, scaffold a minimal app, and perform your
          first deployment to a Personal Developer Instance (PDI).
        </p>
      </Section>

      <Section title="Prerequisites">
        <ul className="list-disc list-inside space-y-1 text-sm" style={{ color: 'var(--color-text-muted)' }}>
          <li>Node.js ≥ 22.0.0 (<code>node --version</code>)</li>
          <li>A free ServiceNow PDI — register at <strong>developer.servicenow.com</strong></li>
          <li>Instance credentials in <code>.env</code> (never commit them)</li>
        </ul>
        <Callout type="danger" title="🔒 Credentials">
          Copy <code>.env.example</code> → <code>.env</code> and fill in your PDI URL, username,
          and password. The <code>.env</code> file is in <code>.gitignore</code>. Treat it like a
          password file — never paste it into chat, issues, or CI logs.
        </Callout>
      </Section>

      <Section title="1 — Install the SDK">
        <CodeBlock
          language="bash"
          filename="terminal"
          code={`# Install the ServiceNow SDK CLI globally
npm install -g @servicenow/sdk

# Verify installation
snc --version
# Expected output: @servicenow/sdk/4.x.x darwin-arm64 node-v22.x.x`}
        />
      </Section>

      <Section title="2 — Scaffold a new application">
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
      </Section>

      <Section title="3 — Configure instance connection">
        <CodeBlock
          language="js"
          filename="now.config.js"
          code={`// now.config.js
// Reads ALL sensitive values from environment variables
// Never hard-code credentials here

import 'dotenv/config'

export default {
  instance: {
    url: process.env.SN_INSTANCE_URL,
    credentials: {
      username: process.env.SN_USERNAME,
      password: process.env.SN_PASSWORD,
    },
  },
}`}
        />
        <Callout type="info">
          The <code>dotenv/config</code> import loads your <code>.env</code> file automatically.
          The SDK reads <code>now.config.js</code> before any CLI operation.
        </Callout>
      </Section>

      <Section title="4 — Build and deploy">
        <CodeBlock
          language="bash"
          filename="terminal"
          code={`# Build the app (compiles metadata to ServiceNow format)
snc app build

# Deploy to your PDI
snc app install

# Watch for changes and re-deploy automatically
snc app install --watch`}
        />
      </Section>

      <Section title="5 — Verify in your PDI">
        <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
          Log in to your PDI → navigate to <strong>System Applications → My Company Applications</strong>.
          You should see <em>Hello Fluent</em> listed with scope <code>x_learn_hello</code>.
        </p>
      </Section>

      <Section title="Key Takeaways">
        <ul className="list-disc list-inside space-y-1 text-sm" style={{ color: 'var(--color-text-muted)' }}>
          <li><code>snc app init</code> scaffolds the full project structure</li>
          <li><code>now.config.js</code> connects to your instance via env vars</li>
          <li><code>snc app build</code> compiles; <code>snc app install</code> deploys</li>
          <li>All credentials live in <code>.env</code>, never in source code</li>
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
