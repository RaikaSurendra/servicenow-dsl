import sdkCli from './npm-knowledge/sdk-cli.md?raw'

export default function Ch13({ CodeBlock, Callout }) {
  return (
    <div className="space-y-8">
      <Section title="Overview">
        <p>
          <code>@servicenow/sdk-cli</code> is the user-facing command interface. It parses developer
          intent from the terminal, manages auth flows, renders progress, and delegates all heavy
          lifting to <code>@servicenow/sdk-api</code>. No metadata compilation or instance HTTP
          logic lives here — it is purely a UX and routing layer.
        </p>
      </Section>

      <Section title="Command Registry">
        <CodeBlock
          language="text"
          filename="dist/command/ layout"
          showLineNumbers={false}
          code={`auth/         → OAuth/OIDC login, logout, credential management
init/         → scaffold a new ServiceNow project
build/        → compile project → emit XML artifacts
install/      → upload + install app on instance
download/     → pull app XML from instance
transform/    → convert downloaded XML to project format
pack/         → create ZIP from built artifacts
clean/        → clear build and pack output directories
dependencies/ → add/manage typed dependency items
explain/      → display API documentation from plugins
upgrade/      → upgrade SDK version
run/          → run a project script (internal)
move-to-app/  → move global records into a scoped app`}
        />
      </Section>

      <Section title="snc build — Actual Flag Shape">
        <CodeBlock
          language="javascript"
          filename="dist/command/build/index.js"
          showLineNumbers={false}
          code={`exports.build = {
  command: 'build [source]',
  describe: 'Compile sources into app files and generate installable package',
  builder: (yargs) => yargs
    .positional('source', {
      describe: 'Path to the project directory',
      default: process.cwd(), type: 'string'
    })
    .option('frozenKeys', {
      describe: 'Throw error if key registry changes — use in CI',
      type: 'boolean', default: false
    })
    .option('ids', {
      describe: 'Array of sys_ids to include in build output',
      type: 'array', string: true, hidden: true
    }),
  handler: async (args) => {
    // → new Orchestrator(project, credential)
    // → await orchestrator.build({ frozenKeys, sysIds })
    // → log result, exit 0/1
  }
}`}
        />
        <Callout type="tip" title="CI tip">
          Always pass <code>--frozenKeys</code> in CI pipelines. This causes the build to fail if
          any <code>Now.ID</code> references resolve to new sys_ids — catching key drift before
          deployment.
        </Callout>
      </Section>

      <Section title="Auth Flow Architecture">
        <CodeBlock
          language="text"
          filename="OIDC login flow"
          showLineNumbers={false}
          code={`snc auth login
  → @inquirer/prompts: "Enter your instance URL"
  → openid-client: OIDC Discovery → Authorization URL
  → open: launch browser to auth endpoint
  → clipboardy: copy device code if needed
  → receive callback with authorization code
  → exchange code for tokens (PKCE)
  → @napi-rs/keyring: store tokens in OS keychain
                        (macOS Keychain / Windows Credential Store / Linux Secret Service)

snc build (later invocations)
  → LazyCredential.getHeaders()
      → @napi-rs/keyring: retrieve stored token
      → inject Authorization: Bearer <token> on all Connector requests`}
        />
      </Section>

      <Section title="Yargs Bootstrap (dist/index.js)">
        <CodeBlock
          language="javascript"
          filename="dist/index.js (structure)"
          showLineNumbers={false}
          code={`yargs
  .check(() => {
    if (!satisfies(process.version, pkg.engines.node)) {
      logger.error(\`now-sdk requires node version to be \${pkg.engines.node}\`)
      process.exit(1)
    }
    return true
  })
  .option('debug', { alias: 'd', type: 'boolean', default: false })
  .command(auth).command(init).command(download).command(build)
  .command(install).command(dependencies).command(transform)
  .command(clean).command(pack).command(explain)
  .command('move', false, require('./command/move-to-app').moveToApp)
  .demandCommand()
  .strictCommands()
  .help()
  .scriptName('now-sdk').argv`}
        />
      </Section>

      <Section title="Runtime Dependencies">
        <CodeBlock
          language="text"
          filename="key dependencies and their roles"
          showLineNumbers={false}
          code={`yargs@17.6.2         → command parsing, help text, positional args
winston@3.8.2        → structured log output with configurable transports
chalk@4.1.2          → ANSI color output for terminal logs
@inquirer/prompts    → interactive prompts (instance URL, confirmations)
openid-client@5.6.5  → OAuth2/OIDC authorization code + PKCE flows
@napi-rs/keyring     → OS keychain bridge (stores credentials securely)
clipboardy@4.0.0     → copies auth codes/tokens to clipboard
tough-cookie@5.1.2   → cookie jar for session continuity
open@8.4.2           → opens browser for OAuth login or docs
semver@7.5.4         → Node version constraint checking`}
        />
      </Section>

      <Section title="Full Reference Notes">
        <CodeBlock
          language="markdown"
          filename="npm-knowledge/sdk-cli.md"
          showLineNumbers={false}
          code={sdkCli}
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
