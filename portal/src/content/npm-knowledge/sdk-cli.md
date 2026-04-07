# Deep Dive: `@servicenow/sdk-cli` (v4.5.0)

## What This Package Is

`@servicenow/sdk-cli` is the **user-facing command interface** for the ServiceNow SDK. It parses developer intent from the terminal, validates arguments, manages auth flows, renders progress, and delegates all heavy lifting to `@servicenow/sdk-api`. No metadata compilation or instance HTTP logic lives here — it is purely a UX and routing layer.

---

## Package Identity

| Field | Value |
|---|---|
| Name | `@servicenow/sdk-cli` |
| Version | `4.5.0` |
| Main entry | `dist/index.js` |
| TypeScript declarations | `dist/index.d.ts` |
| Node.js required | `>= 20.18.0` |
| Package manager | `pnpm >= 10.8.0` |
| Unpacked size | ~286 KB / 122 files |

---

## Command Registry

The CLI registers these commands via `yargs` in `dist/index.js`:

| Command | Module | What it does |
|---|---|---|
| `auth` | `dist/command/auth/` | OAuth/OIDC login, logout, credential management |
| `init` | `dist/command/init/` | Scaffold a new ServiceNow project |
| `build [source]` | `dist/command/build/` | Compile project → emit XML artifacts |
| `install` | `dist/command/install/` | Upload + install app on instance |
| `download` | `dist/command/download/` | Pull app XML from instance |
| `transform` | `dist/command/transform/` | Convert downloaded XML to project format |
| `pack` | `dist/command/pack/` | Create ZIP from built artifacts |
| `clean` | `dist/command/clean/` | Clear build and pack output directories |
| `dependencies` | `dist/command/dependencies/` | Add/manage typed dependency items |
| `explain` | `dist/command/explain/` | Display API documentation from plugins |
| `upgrade` | `dist/command/upgrade/` | Upgrade SDK version |
| `run [script]` | `dist/command/run/` | Run a project script (hidden, for internal use) |
| `move` | `dist/command/move-to-app/` | Move global records into a scoped app |

---

## Yargs Wiring (actual `dist/index.js` structure)

```js
yargs
  .check(() => {
    // Node version guard: fails if Node < engines.node requirement
    if (!satisfies(process.version, pkg.engines.node)) {
      logger.error(`now-sdk requires node version to be ${pkg.engines.node}`)
      process.exit(1)
    }
    return true
  })
  .usage(usage)
  .option('debug', { alias: 'd', type: 'boolean', default: false })
  .command(auth)
  .command(init)
  .command(download)
  .command(build)
  .command(install)
  .command(dependencies)
  .command(transform)
  .command('run [script]', false, require('./command/run').run)
  .command(clean)
  .command(pack)
  .command(explain)
  .command('move', false, require('./command/move-to-app').moveToApp)
  .demandCommand()        // requires a subcommand — bare `now-sdk` prints help
  .strictCommands()       // unknown commands are errors
  .help()
  .scriptName('now-sdk')
  .argv
```

---

## `snc build` — Command Shape

```js
// dist/command/build/index.js
exports.build = {
  command: 'build [source]',
  describe: 'Compile sources into app files and generate installable package',
  builder: (yargs) => yargs
    .positional('source', {
      describe: 'Path to the project directory',
      default: process.cwd(),
      type: 'string'
    })
    .option('frozenKeys', {
      describe: 'Throw error if key registry changes (use in CI)',
      type: 'boolean',
      default: false
    })
    .option('ids', {
      describe: 'Array of sys_ids to include in build output',
      type: 'array',
      string: true,
      hidden: true   // internal/advanced flag
    })
    .option('profile', {
      describe: 'Emit a CPU profile for performance analysis',
      type: 'boolean',
      default: false,
      hidden: true
    }),

  handler: async (args) => {
    // → creates Project from args.source
    // → new Orchestrator(project, credential)
    // → await orchestrator.build({ frozenKeys: args.frozenKeys, sysIds: args.ids })
    // → logs result, exits 0/1
  }
}
```

**Key design:** the `handler` is thin — it constructs the `Orchestrator` and calls `build()`. The SDK-API layer owns all compiler logic.

---

## Runtime Dependencies Explained

| Dependency | Version | Why it's needed |
|---|---|---|
| `@servicenow/sdk-api` | 4.5.0 | Core lifecycle: Orchestrator, ProjectFactory, Connector |
| `@servicenow/sdk-build-core` | 4.5.0 | Shared build types consumed by some command handlers |
| `yargs` | 17.6.2 | Command parsing, help text generation, positional args |
| `winston` | 3.8.2 | Structured log output with configurable transports |
| `chalk` | 4.1.2 | ANSI color output for terminal logs |
| `@inquirer/prompts` | 3.1.1 | Interactive prompts (e.g., enter instance URL, confirm action) |
| `openid-client` | 5.6.5 | OAuth2 / OIDC authorization code + PKCE flows |
| `@napi-rs/keyring` | 1.2.0 | OS keychain bridge (stores credentials in macOS Keychain, Windows Credential Store, Linux Secret Service) |
| `clipboardy` | 4.0.0 | Copies auth codes or tokens to clipboard for UX flows |
| `tough-cookie` | 5.1.2 | Cookie jar management for session continuity |
| `open` | 8.4.2 | Opens browser for OAuth login or documentation |
| `semver` | 7.5.4 | Node version constraint checking |
| `lodash` | 4.17.23 | Utilities |

---

## Auth Flow Architecture

The `auth` command manages the full OIDC login lifecycle:

```
snc auth login
  → @inquirer/prompts: "Enter your instance URL"
  → openid-client: OIDC Discovery → Authorization URL
  → open: launch browser to auth endpoint
  → clipboardy: copy device code if needed
  → receive callback with authorization code
  → exchange code for tokens (PKCE)
  → @napi-rs/keyring: store tokens in OS keychain

snc build (later invocation)
  → LazyCredential.getHeaders()
      → @napi-rs/keyring: retrieve stored token
      → inject Authorization: Bearer <token> on requests
```

The keyring stores credentials per instance URL. Multiple instances can have separate stored credentials.

---

## Logger Layer (`dist/logger/`)

The `winston`-based logger provides structured output:

- **`--debug` flag** → sets log level to `debug`, emits verbose internal SDK messages
- **Without `--debug`** → only `info`, `warn`, `error` are shown
- CI output is plain text; TTY output includes colors via `chalk`
- Build diagnostics (TypeScript errors in your scripts) are formatted with file path, line number, and message severity

---

## Non-Interactive Mode (CI)

All commands that require user input have flag-based alternatives:

```bash
# Instead of interactive prompts, supply all required values as flags
snc build --frozenKeys                    # fail if key registry changes
snc install --packageZipPath ./app.zip   # skip pack step
snc download --method incremental --lastPull 2024-01-01T00:00:00Z
```

The `--debug` flag works in all environments and appends CPU profile output when combined with `--profile`.

---

## Architecture Position

```
Developer terminal / CI runner
        │
        ▼
@servicenow/sdk-cli  (dist/command/*)
  ├── yargs: parse argv → command + options
  ├── @inquirer/prompts: interactive UX when needed
  ├── winston + chalk: log formatting
  ├── openid-client + @napi-rs/keyring: auth resolution
  └── calls @servicenow/sdk-api
          ├── Orchestrator.build()
          ├── Orchestrator.install()
          ├── Orchestrator.download()
          ├── Orchestrator.types()
          └── ...all other lifecycle operations
```

---

## CLI Sequence Diagram

```
Dev: snc build --install

sdk-cli/command/build/handler
  → validate project path (process.cwd() default)
  → LazyCredential (resolve from keychain)
  → new Orchestrator(project, credential)

  → orchestrator.build()
        sdk-build-plugins (each plugin)
        → @servicenow/glide (type checks)
        → emit XML to appOutDir
  ← BuildResultSuccess { packOutput }

  → orchestrator.pack()
  ← app.zip path

  → orchestrator.install({ packageZipPath })
        Connector.uploadScopedAppPackage(zip)
        → undici POST /api/now/app_store_mtx/package/app
        ← { trackerId, rollbackId }
        poll installStatus()
        ← { finished: true, id }

logger: "Install complete"
process.exit(0)
```

---

## Source References

- `docs/npm-packs/extract/servicenow-sdk-cli-4.5.0/package/dist/`
- `https://www.npmjs.com/package/@servicenow/sdk-cli`
