

export default function Ch10({ CodeBlock, Callout }) {
  return (
    <div className="space-y-10">

      <Section title="Overview">
        <p>
          When you run <code>npm install @servicenow/sdk</code>, you are pulling down one umbrella
          package that depends on six others. Each package owns a distinct layer of the compiler
          pipeline. This chapter walks through every package, inspects what is actually inside
          each distribution, and traces how a single call like <code>snc build</code> crosses all
          of them.
        </p>
        <p style={{ marginTop: '12px' }}>
          All version data and dependency graphs are sourced directly from the npm registry
          (<code>registry.npmjs.org</code>) at v4.5.0, the latest stable release as of March 2026.
        </p>
        <Callout type="info" title="How to verify this yourself">
          Every claim in this chapter can be independently verified:
          <br /><code>curl https://registry.npmjs.org/@servicenow/sdk | jq '.versions["4.5.0"]'</code>
        </Callout>
      </Section>

      <Section title="High-level Diagram">
        <img src="/diagrams/sdk-umbrella.svg" alt="ServiceNow SDK ecosystem overview" style={{ width: '100%', maxWidth: 720, borderRadius: 8, border: '1px solid var(--color-border)' }} />
      </Section>

      <Section title="Deep Dives (Ch11–Ch17)">
        <p>
          This chapter is a concise ecosystem overview. Open the dedicated chapters for details:
        </p>
        <CodeBlock
          language="text"
          filename="Index"
          showLineNumbers={false}
          code={`CH11 — @servicenow/sdk (umbrella)
CH12 — @servicenow/sdk-api
CH13 — @servicenow/sdk-cli
CH14 — @servicenow/sdk-core
CH15 — @servicenow/sdk-build-plugins
CH16 — @servicenow/glide
CH17 — undici`}
        />
        <Callout type="tip">
          Use Prev/Next below or go Home to select chapters.
        </Callout>
      </Section>

      {/* ── Package graph ── */}
      <Section title="The Full Package Dependency Graph">
        <p>
          The SDK is not one monolith. It is seven coordinated packages, each with a specific
          responsibility and a clean layer boundary:
        </p>
        <CodeBlock
          language="bash"
          filename="package dependency graph (v4.5.0)"
          showLineNumbers={false}
          code={`@servicenow/sdk  (umbrella · bin: sdk, now-sdk, now-sdk-debug)
├── @servicenow/sdk-cli        CLI interface layer
│   ├── yargs 17               argument parsing
│   ├── winston 3.8            structured logging
│   ├── chalk 4                terminal colour output
│   ├── @inquirer/prompts 3    interactive prompts (snc init)
│   ├── openid-client 5.6      OAuth 2.0 / OIDC auth (added v4.0)
│   └── @servicenow/sdk-api    ← calls into API layer
│
├── @servicenow/sdk-api        API & deployment layer (140 files · 2.4 MB)
│   ├── zod 3.23.8             payload schema validation
│   ├── lodash 4.17.23         utility functions
│   ├── handlebars 4.7.8       template-based code/XML generation
│   ├── fast-xml-parser 5.3.7  reads XML from instance responses
│   ├── crypto-js 4.2.0        request signing / HMAC auth
│   ├── @servicenow/sdk-build-core
│   └── @servicenow/sdk-build-plugins
│
├── @servicenow/sdk-core       type system (1,635 files · 6 MB)
│   └── zod 3.22.4             sole production dependency
│
└── undici 6.19.8              HTTP client for all instance network calls

Support packages (used by sdk-api and sdk-build-plugins):
├── @servicenow/sdk-build-core   compiler engine
│   ├── ts-morph 24.0.0          TypeScript AST read/write
│   ├── xmlbuilder2 3.1.1        XML document construction
│   ├── vscode-languageserver 9  LSP protocol support
│   ├── prettier 3.6.1           output code formatting
│   ├── fast-glob 3.3.3          file discovery
│   ├── lodash 4.17.23
│   └── zod 3.23.8
│
└── @servicenow/sdk-build-plugins   plugin registry
    ├── eslint 9.39.4               static analysis
    ├── xmlbuilder2 + xml-js + fast-xml-parser   XML toolchain
    ├── @cyclonedx/cyclonedx-library 8.6   SBOM generation
    ├── packageurl-js 2.0.1         package URL standard
    ├── md5.js                      checksum generation
    └── @servicenow/glide 27.0.5    ← uses platform types during build

@servicenow/glide  (v27.0.5 — versioned SEPARATELY from sdk)
    No production dependencies
    Dev deps: ts-morph 20, ctix 1.8.2, typescript 5.9.3`}
        />
      </Section>

      {false && (
        <>
      {/* ── @servicenow/sdk ── */}
      <Section title="@servicenow/sdk — The Umbrella Orchestrator">
        <SubSection label="What it contains">
          <p>
            The root package is intentionally thin. Its job is to stitch the sub-packages together
            and expose three binary entry points:
          </p>
          <CodeBlock
            language="json"
            filename="package.json bin field"
            code={`{
  "bin": {
    "sdk":           "./dist/cli/index.js",
    "now-sdk":       "./dist/cli/index.js",
    "now-sdk-debug": "./dist/cli/debug.js"
  }
}`}
          />
          <p style={{ marginTop: '10px' }}>
            <code>sdk</code> and <code>now-sdk</code> are aliases — both point to the same CLI
            entry. <code>now-sdk-debug</code> starts with <code>NODE_OPTIONS=--inspect</code>
            pre-set, so you can attach a Node.js debugger to a live build.
          </p>
        </SubSection>

        <SubSection label="Exports map — six named sub-paths">
          <CodeBlock
            language="json"
            filename="exports (simplified)"
            code={`{
  "./api":        "./dist/api/index.js",       // browser: ./dist/web/index.js
  "./lsp":        "./dist/lsp/index.js",
  "./core":       "./src/core/index.ts",        // source — consumed by sdk-core
  "./global":     "./dist/global/index.js",
  "./automation": "./src/automation/index.ts"
}`}
          />
          <p style={{ marginTop: '10px' }}>
            The dual condition on <code>./api</code> (Node default / browser override) is how the
            same package ships a Node.js HTTP client and a browser-safe version for Now Experience
            UI components that need to call platform APIs.
          </p>
        </SubSection>

        <SubSection label="undici — why not node-fetch or axios?">
          <p>
            The SDK ships <strong>undici</strong> (the same HTTP client that powers Node.js
            built-in <code>fetch</code>) instead of the more common <code>axios</code> or
            <code>node-fetch</code>. The reasons are visible in the build scripts:
          </p>
          <CodeBlock
            language="bash"
            filename="why undici"
            showLineNumbers={false}
            code={`• Native Node.js HTTP/1.1 and HTTP/2 via WHATWG Fetch-compatible API
• Connection pooling built-in — important for deploy loops with many requests
• No auto-redirect chase (configurable) — instance auth redirects must be explicit
• Zero extra dependencies — undici ships as a single compiled bundle
• Same engine Node.js uses internally — no version drift with platform HTTP`}
          />
        </SubSection>
      </Section>

      {/* ── @servicenow/sdk-core ── */}
      <Section title="@servicenow/sdk-core — The Type System (1,635 Files)">
        <SubSection label="Why it's so large">
          <p>
            At 6 MB unpacked and 1,635 files in v4.5.0 (up from 574 files in v1.0.x), sdk-core
            holds the complete definition of every metadata type the SDK can compile. Each metadata
            type — <code>table</code>, <code>restAPI</code>, <code>scriptInclude</code>,
            <code>flow</code>, <code>uiPage</code>, catalog variables, portal widgets — has its
            own directory under <code>src/</code> with a full type definition, validation schema,
            and schema fixtures.
          </p>
        </SubSection>

        <SubSection label="Single dependency: zod">
          <p>
            sdk-core has exactly one production dependency: <strong>zod</strong>. This is
            deliberate — every metadata type's schema is a Zod object, which gives the SDK
            both runtime validation and TypeScript type inference from the same source of truth:
          </p>
          <CodeBlock
            language="js"
            filename="how sdk-core uses zod (conceptual)"
            code={`import { z } from 'zod'

// Inside sdk-core, each type is a Zod schema
const TableFieldSchema = z.object({
  label:     z.string(),
  mandatory: z.boolean().optional(),
  readOnly:  z.boolean().optional(),
  default:   z.unknown().optional(),
})

const TableSchema = z.object({
  name:   z.string().regex(/^[a-z][a-z0-9_]*$/),
  label:  z.string(),
  fields: z.record(TableFieldSchema),
  extends: z.string().optional(),
})

// TypeScript type is derived FROM the schema — single source of truth
export type TableSpec = z.infer<typeof TableSchema>

// validate() is called by sdk-build-core during Stage 1 of the build pipeline
export function validateTable(spec: unknown): TableSpec {
  return TableSchema.parse(spec)
}`}
          />
        </SubSection>

        <SubSection label="Export structure: modular by design">
          <CodeBlock
            language="json"
            filename="exports map pattern"
            code={`{
  "./*":          "./src/*/index.ts",   // each type in its own module
  "./global":     "./dist/global/index.d.ts",
  "./runtime/*":  "./dist/*/index.js"   // compiled runtime helpers
}`}
          />
          <p style={{ marginTop: '10px' }}>
            The <code>./runtime/*</code> exports are a key distinction: sdk-core ships both
            TypeScript source (for the build pipeline to import during compilation) <em>and</em>
            pre-compiled JavaScript (for use at Node.js runtime). This is needed because
            <code>sdk-build-core</code> imports core schemas during the build process itself.
          </p>
        </SubSection>

        <SubSection label="How core grew from v1 to v4.5">
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                  {['Version', 'Files', 'What was added'].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '7px 12px 7px 0', color: 'var(--color-text-primary)', fontWeight: 600 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  ['v1.0.x', '574',   'Tables, Script Includes, REST APIs, Business Rules — foundation types'],
                  ['v2.x',   '614',   'Flow API (partial), UI Policies, Import Sets'],
                  ['v4.2',   '~900',  'Generic GlideRecord<T>, Duration/Time helpers, ImportSet full API'],
                  ['v4.3',   '~1200', 'Full Flow API: triggers, actions, sub-flows; 31 catalog variable types'],
                  ['v4.5',   '1,635', 'Now Assist Skill Kit, AI Agent Studio, Instance Scan APIs, Service Portal'],
                ].map(([v, files, what]) => (
                  <tr key={v} style={{ borderBottom: '1px solid var(--color-border)' }}>
                    <td style={{ padding: '8px 12px 8px 0', fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--color-sn-green-light)' }}>{v}</td>
                    <td style={{ padding: '8px 12px 8px 0', fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--color-text-secondary)' }}>{files}</td>
                    <td style={{ padding: '8px 0', color: 'var(--color-text-secondary)', fontWeight: 300, fontSize: '13px' }}>{what}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SubSection>
      </Section>

      {/* ── @servicenow/sdk-build-core ── */}
      <Section title="@servicenow/sdk-build-core — The Compiler Engine">
        <p>
          This is the most technically complex package. It contains the actual compilation
          logic: reading TypeScript source, traversing the AST, generating XML. It is used
          by both <code>sdk-api</code> (for deployment) and <code>sdk-build-plugins</code>
          (for individual type transformers). Let's examine each major dependency and why
          it was chosen:
        </p>

        <SubSection label="ts-morph 24.0.0 — TypeScript AST manipulation">
          <CodeBlock
            language="js"
            filename="what sdk-build-core uses ts-morph for (conceptual)"
            code={`import { Project } from 'ts-morph'

const project = new Project({ tsConfigFilePath: 'tsconfig.json' })

// Stage 1: Scan all source files for metadata exports
for (const sourceFile of project.getSourceFiles('src/**/*.ts')) {
  for (const exportedDecl of sourceFile.getExportedDeclarations()) {
    const [name, declarations] = exportedDecl

    for (const decl of declarations) {
      // Look for calls like: export default table({ ... })
      if (isCallExpression(decl)) {
        const fnName = decl.getExpression().getText()  // "table"
        const args   = decl.getArguments()

        if (KNOWN_METADATA_TYPES.has(fnName)) {
          // Evaluate the argument object statically (no require/import)
          const spec = evaluateStaticObject(args[0])
          registry.add({ type: fnName, spec, sourceFile: sourceFile.getFilePath() })
        }
      }
    }
  }
}`}
          />
          <p style={{ marginTop: '10px' }}>
            <code>ts-morph</code> wraps the official TypeScript compiler API with a much nicer
            interface. The SDK uses it to <em>statically evaluate</em> your Fluent calls without
            running them — no <code>require()</code>, no script execution, pure AST traversal.
            This is how <code>snc build</code> can work offline with zero network calls.
          </p>
        </SubSection>

        <SubSection label="xmlbuilder2 3.1.1 — XML generation">
          <p>
            Every metadata record becomes a ServiceNow Update Set XML element. <code>xmlbuilder2</code>
            provides a fluent builder API that handles character escaping, CDATA wrapping, and
            attribute quoting correctly — things raw string concatenation would get wrong:
          </p>
          <CodeBlock
            language="js"
            filename="xmlbuilder2 in the XML generation stage (conceptual)"
            code={`import { create } from 'xmlbuilder2'

// Generating the XML for a Script Include
function scriptIncludeToXml(spec, context) {
  return create({ version: '1.0', encoding: 'UTF-8' })
    .ele('record_update', { table: 'sys_script_include' })
      .ele('sys_script_include', { action: 'INSERT_OR_UPDATE' })
        .ele('name').txt(\`\${context.scope}.\${spec.name}\`).up()
        .ele('api_name').txt(\`\${context.scope}.\${spec.name}\`).up()
        .ele('active').txt('true').up()
        .ele('access').txt('public').up()
        // Script source goes in CDATA so special chars are preserved
        .ele('script').dat(spec.scriptSource).up()
        .ele('sys_scope').txt(context.scopeSysId).up()
      .up()
    .end({ prettyPrint: true })
}`}
          />
        </SubSection>

        <SubSection label="vscode-languageserver 9.0.1 — LSP support">
          <p>
            The <code>./lsp</code> export on the root <code>@servicenow/sdk</code> package
            implements the Language Server Protocol. When your editor (VS Code, Cursor, Neovim)
            opens a <code>.now.ts</code> file, it talks to this LSP server to get:
          </p>
          <ul style={{ margin: '8px 0', padding: '0 0 0 20px', lineHeight: '1.9', fontSize: '13px', color: 'var(--color-text-secondary)' }}>
            <li>Autocomplete for Fluent DSL function arguments</li>
            <li>Hover documentation for <code>field.choice()</code>, <code>restAPI()</code>, etc.</li>
            <li>Real-time build errors before you run <code>snc build</code></li>
            <li>Go-to-definition for cross-file imports within your app scope</li>
          </ul>
          <p>
            The LSP runs in the same process as the build pipeline — it re-uses the same
            sdk-build-core metadata registry so editor diagnostics and CLI diagnostics are
            always consistent.
          </p>
        </SubSection>

        <SubSection label="prettier 3.6.1 — code formatting">
          <p>
            <code>snc transform</code> (which reverse-converts instance XML back to Fluent DSL)
            uses Prettier to format the generated TypeScript output. This ensures the
            reverse-compiled code is readable and matches common style conventions, not just
            syntactically valid.
          </p>
        </SubSection>
      </Section>

      {/* ── @servicenow/sdk-build-plugins ── */}
      <Section title="@servicenow/sdk-build-plugins — The Plugin Registry">
        <p>
          Where <code>sdk-build-core</code> provides the compilation infrastructure,
          <code>sdk-build-plugins</code> registers the actual transformers for each metadata
          type. The distinction: core provides the pipeline, plugins provide type-specific
          knowledge.
        </p>

        <SubSection label="ESLint 9.39.4 — static analysis during build">
          <p>
            The SDK runs a subset of ESLint rules as part of <code>snc build</code>. This is
            not generic linting — it is a custom ESLint configuration that checks
            ServiceNow-specific patterns:
          </p>
          <CodeBlock
            language="bash"
            filename="what the SDK ESLint rules check"
            showLineNumbers={false}
            code={`• No async/await in cross-scope x_require() exported functions
• No direct DOM APIs in server-side modules (GlideRecord files)
• No undeclared x_require() calls (must go through snc dependencies first)
• No eval() or Function() constructor in any server-side code
• Scoped table names must match the configured app scope prefix`}
          />
        </SubSection>

        <SubSection label="CycloneDX SBOM generation">
          <p>
            Since v4.3, <code>snc pack</code> automatically generates a Software Bill of
            Materials (SBOM) for every packaged app. The <code>@cyclonedx/cyclonedx-library</code>
            dependency handles this. The output is a <code>bom.json</code> file in CycloneDX
            JSON format embedded in the <code>.zip</code> archive:
          </p>
          <CodeBlock
            language="bash"
            filename="what the SBOM contains"
            showLineNumbers={false}
            code={`# Inside the .zip produced by snc pack:
app-bundle.zip
├── metadata/          ← ServiceNow XML artifacts
├── bom.json           ← CycloneDX SBOM
│   ├── metadata.component  (your app name, version, scope)
│   ├── components[]        (all npm deps bundled into the app)
│   └── dependencies[]      (dependency graph)
└── manifest.json`}
          />
          <p style={{ marginTop: '10px' }}>
            This matters for enterprise customers who require supply chain attestation before
            installing apps on production instances.
          </p>
        </SubSection>

        <SubSection label="Why sdk-build-plugins depends on @servicenow/glide">
          <p>
            This is a subtle but important architectural point. The plugins that transform
            server-side code (Business Rules, Script Includes, Scheduled Jobs) need to
            understand what Glide APIs are available. By depending on <code>@servicenow/glide</code>
            at build time, the build pipeline can:
          </p>
          <ul style={{ margin: '8px 0', padding: '0 0 0 20px', lineHeight: '1.9', fontSize: '13px', color: 'var(--color-text-secondary)' }}>
            <li>Validate that GlideRecord method calls reference real platform APIs</li>
            <li>Detect use of deprecated Glide APIs and emit warnings</li>
            <li>Generate TypeScript declarations for deployed Script Includes</li>
          </ul>
          <Callout type="tip">
            This means your Glide type errors are caught at <code>snc build</code> time,
            not at runtime on your instance. The build pipeline knows the same type surface
            as your IDE does.
          </Callout>
        </SubSection>
      </Section>

      {/* ── @servicenow/sdk-api ── */}
      <Section title="@servicenow/sdk-api — The Platform API Layer (140 Files · 2.4 MB)">
        <p>
          This is the bridge between your local build artifacts and your ServiceNow instance.
          All network operations — deploying XML, creating update sets, authenticating,
          polling deployment status — live here.
        </p>

        <SubSection label="handlebars 4.7.8 — template-based generation">
          <p>
            Parts of the SDK output are generated from Handlebars templates rather than
            programmatic string building. This applies primarily to <code>snc init</code>
            scaffold output and <code>snc transform</code> reverse-compilation:
          </p>
          <CodeBlock
            language="handlebars"
            filename="now.config.js.hbs (scaffolding template — conceptual)"
            code={`import 'dotenv/config'

function requireEnv(name) {
  const val = process.env[name]
  if (!val) throw new Error(\`Missing env var: \${name}\`)
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
  {{#if hasScope}}
  app: { scope: '{{scope}}' },
  {{/if}}
}`}
          />
          <p style={{ marginTop: '10px' }}>
            Using Handlebars rather than string interpolation means scaffold templates are
            editable by contributors who do not know TypeScript — they are plain text files
            with minimal logic.
          </p>
        </SubSection>

        <SubSection label="crypto-js 4.2.0 — request authentication">
          <p>
            ServiceNow instances support basic auth, OAuth 2.0, and mutual TLS. For basic auth
            flows, <code>crypto-js</code> handles Base64 encoding and, for some auth token
            refresh patterns, HMAC signing. The library was chosen over Node's built-in
            <code>crypto</code> module because sdk-api also ships a browser build (the
            <code>./dist/web/index.js</code> export), and <code>crypto-js</code> is browser-
            compatible while <code>node:crypto</code> is not.
          </p>
        </SubSection>

        <SubSection label="fast-xml-parser 5.3.7 — reading instance responses">
          <p>
            When you run <code>snc download</code>, the SDK fetches Update Set XML from your
            instance and parses it back into JavaScript objects before <code>sdk-build-core</code>
            can transform it into Fluent DSL. <code>fast-xml-parser</code> handles this — it is
            significantly faster than <code>xml2js</code> or the built-in DOM parser for large
            Update Set files.
          </p>
          <CodeBlock
            language="js"
            filename="parsing downloaded XML (conceptual)"
            code={`import { XMLParser } from 'fast-xml-parser'

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  cdataPropName: '__cdata',   // preserve CDATA blocks as-is (script source)
  parseAttributeValue: true,
})

const parsed = parser.parse(xmlFromInstance)
// parsed.record_update.sys_script_include.__cdata ← your script source`}
          />
        </SubSection>

        <SubSection label="The deployment sequence — what sdk-api actually does">
          <CodeBlock
            language="bash"
            filename="snc install — full network sequence"
            showLineNumbers={false}
            code={`1) Authenticate to instance (basic auth or OAuth token exchange)
2) POST /api/now/table/sys_update_set — create a new Update Set
3) PUT  update set to In Progress state
4) For each XML file in metadata/:
   a) POST /api/now/table/{table_name} — load record into Update Set
   b) Verify 201 response; retry up to 3x on 5xx
5) POST /api/now/table/sys_update_preview_problem — preview Update Set
6) Check for preview conflicts; abort if critical conflicts exist
7) POST /api/now/table/sys_update_set_commit — commit Update Set
8) Poll sys_update_set until state = "committed"
9) Log summary: N records deployed, M warnings`}
          />
          <Callout type="warning">
            Steps 6–9 are the most failure-prone. Preview conflicts occur when your metadata
            collides with another app in the same scope, or when a referenced table does not
            exist on the target instance. Always check preview output before committing.
          </Callout>
        </SubSection>
      </Section>

      {/* ── @servicenow/sdk-cli ── */}
      <Section title="@servicenow/sdk-cli — The Command Interface">
        <p>
          sdk-cli is the user-facing layer. It owns argument parsing, interactive prompts,
          logging, and authentication. It orchestrates the other packages but contains
          no compilation logic itself.
        </p>

        <SubSection label="yargs 17.6.2 — command structure">
          <p>
            Each <code>snc</code> subcommand (<code>init</code>, <code>build</code>,
            <code>install</code>, etc.) is a separate Yargs command module. The pattern maps
            directly to the files you can see in <code>dist/commands/</code>:
          </p>
          <CodeBlock
            language="js"
            filename="CLI command registration pattern (conceptual)"
            code={`// dist/commands/build.js — what the build command looks like internally
export const command  = 'build'
export const describe = 'Compile source files to metadata artifacts'
export const builder  = (yargs) => yargs
  .option('config', { alias: 'c', type: 'string', default: 'now.config.js' })
  .option('watch',  { alias: 'w', type: 'boolean', default: false })
  .option('verbose',{ alias: 'v', type: 'boolean', default: false })

export async function handler(argv) {
  const config  = await loadConfig(argv.config)       // sdk-api
  const result  = await buildPipeline(config, argv)   // sdk-build-core
  if (!result.ok) process.exit(1)
}`}
          />
        </SubSection>

        <SubSection label="winston 3.8.2 — structured logging">
          <p>
            All CLI output goes through Winston. This is why SDK logs have a consistent
            format and why you can redirect them with <code>--log-level silent</code> in
            CI pipelines:
          </p>
          <CodeBlock
            language="js"
            filename="SDK log levels"
            code={`// SDK winston transports (conceptual)
const logger = winston.createLogger({
  level: argv.verbose ? 'debug' : 'info',
  format: winston.format.combine(
    winston.format.colorize(),   // uses chalk 4 for terminal colour
    winston.format.printf(({ level, message }) => \`[\${level}] \${message}\`)
  ),
  transports: [new winston.transports.Console()],
})

// What you see at different log levels:
// info:  Build complete. 12 records.
// warn:  Preview conflict: sys_db_object x_myapp_table (non-critical)
// error: Authentication failed: 401 Unauthorized
// debug: [Stage 1] Scanned 18 files, found 6 metadata exports`}
          />
        </SubSection>

        <SubSection label="@inquirer/prompts 3.1.1 — snc init interactivity">
          <p>
            The interactive <code>snc init</code> prompt is built on Inquirer v3. Each question
            is a typed prompt with validation:
          </p>
          <CodeBlock
            language="js"
            filename="snc init prompt flow (conceptual)"
            code={`import { input, select, confirm } from '@inquirer/prompts'

const appName  = await input({
  message: 'Application name:',
  validate: (v) => v.trim().length > 0 || 'Name is required',
})

const scope    = await input({
  message: 'Application scope prefix (e.g. x_myco_myapp):',
  validate: (v) => /^x_[a-z][a-z0-9_]+$/.test(v) || 'Must start with x_ and use lowercase',
})

const template = await select({
  message: 'Project template:',
  choices: [
    { value: 'minimal',   name: 'Minimal — app config only'        },
    { value: 'standard',  name: 'Standard — tables + REST API'     },
    { value: 'full-stack',name: 'Full-stack — tables + REST + UI'  },
  ],
})

// Then sdk-api renders the selected Handlebars templates
await scaffoldProject({ appName, scope, template })`}
          />
        </SubSection>

        <SubSection label="The v4.0 auth migration: keytar → openid-client">
          <p>
            Before v4.0, the SDK stored instance credentials in the OS keychain via
            <code>keytar</code>. In v4.0, keytar was removed from the core dependency list
            (moved to optional) and replaced with <code>openid-client</code>. Here is why:
          </p>
          <CodeBlock
            language="bash"
            filename="keytar → openid-client migration rationale"
            showLineNumbers={false}
            code={`Problem with keytar (pre-v4.0):
  • Native Node.js addon — required node-gyp compilation at install time
  • Broke on every major Node.js version bump (N-API compatibility)
  • Caused install failures in Docker and CI environments (no keychain daemon)
  • Only supported simple username/password; no OAuth token refresh

openid-client (v4.0+):
  • Pure JavaScript — no native compilation, no keychain daemon required
  • Full OAuth 2.0 / OIDC support: authorization_code, client_credentials flows
  • Token refresh handled automatically (ServiceNow OAuth tokens expire in 30 min)
  • Works identically in Docker, CI, and developer desktops
  • Credentials stored in .snc/auth.json (encrypted, git-ignored by SDK scaffolding)`}
          />
        </SubSection>
      </Section>

      {/* ── @servicenow/glide ── */}
      <Section title="@servicenow/glide — The Type Declarations (Versioned Separately)">
        <SubSection label="Why a completely separate version number?">
          <p>
            <code>@servicenow/glide</code> is at <strong>v27.0.5</strong> while the SDK is at
            v4.5.0. These version numbers track different things:
          </p>
          <CodeBlock
            language="bash"
            filename="version semantics"
            showLineNumbers={false}
            code={`@servicenow/sdk    v4.5.0   ← SDK toolchain generation
@servicenow/glide  v27.0.5  ← ServiceNow platform API release

glide version ≈ ServiceNow release train:
  v25.x  → Washington release
  v26.x  → Xanadu release
  v27.x  → Yokohama / current

This means: you can stay on sdk@4.5.0 but update glide@27.x as new
ServiceNow platform APIs ship, without needing a full SDK update.`}
          />
        </SubSection>

        <SubSection label="No production dependencies — only type declarations">
          <p>
            The entire <code>@servicenow/glide</code> package is TypeScript declaration files
            (<code>.d.ts</code>). It ships zero runtime JavaScript. When you write:
          </p>
          <CodeBlock
            language="js"
            filename="how glide types work"
            code={`/// <reference types="@servicenow/glide" />

// After this triple-slash directive, these are available globally:
const gr  = new GlideRecord('incident')    // ✓ typed
const ga  = new GlideAggregate('incident') // ✓ typed
const gdt = new GlideDateTime()            // ✓ typed
gs.log('hello')                            // ✓ typed
gs.getUser()                               // ✓ typed

// No import needed — these are AMBIENT declarations
// They tell TypeScript: "trust me, these globals exist at runtime"
// The actual runtime objects are provided by ServiceNow's Rhino engine`}
          />
        </SubSection>

        <SubSection label="How the types are generated (ts-morph + ctix)">
          <p>
            The <code>@servicenow/glide</code> types are not hand-written — they are generated
            from ServiceNow's platform schema using a two-tool pipeline:
          </p>
          <CodeBlock
            language="bash"
            filename="glide type generation pipeline (dev deps only)"
            showLineNumbers={false}
            code={`1) ServiceNow platform schema (source of truth)
      ↓
2) ts-morph 20.0.0
   • Reads platform API definitions
   • Generates TypeScript class/interface declarations
   • Adds JSDoc comments from platform documentation
   • Creates method signatures with correct parameter and return types
      ↓
3) ctix 1.8.2 (Create TypeScript Index)
   • Scans all generated .d.ts files
   • Creates barrel exports: src/types/index.d.ts
   • Ensures all APIs are accessible from the single entry point
      ↓
4) Published to npm as @servicenow/glide@27.x`}
          />
          <p style={{ marginTop: '10px' }}>
            This generation pipeline means glide type updates can ship whenever the platform
            changes, independent of SDK releases. It also means the TypeScript types are
            authoritative — they are derived from the same schema that the platform itself uses.
          </p>
        </SubSection>

        <SubSection label="Checking which Glide APIs are typed">
          <CodeBlock
            language="bash"
            filename="inspect glide coverage"
            code={`# See all typed classes
node -e "
const g = require('@servicenow/glide')
console.log(Object.keys(g).filter(k => k.startsWith('Glide')).sort().join('\\n'))
"

# Notable classes covered in v27.0.5:
GlideRecord           GlideRecordSecure    GlideAggregate
GlideDateTime         GlideDate            GlideDuration
GlideSystem           GlideScopedEvaluator GlideSession
GlideEmailOutbound    GlideEncrypter       GlideTextReader
GlideServletRequest   GlideServletResponse GlideStringUtil
XMLDocument           XMLNode              RESTMessageV2`}
          />
        </SubSection>
      </Section>

        </>
      )}

      {/* ── How to inspect packages yourself ── */}
      <Section title="How to Inspect These Packages Yourself">
        <p>
          You do not need to trust this chapter. Every claim here can be verified in under
          two minutes from the npm registry or a local install.
        </p>

        <SubSection label="Method 1: npm registry JSON">
          <CodeBlock
            language="bash"
            filename="terminal"
            code={`# Full package manifest for a specific version
curl -s https://registry.npmjs.org/@servicenow/sdk/4.5.0 | jq '{
  description,
  main,
  bin,
  exports,
  dependencies,
  engines
}'

# List all versions
curl -s https://registry.npmjs.org/@servicenow/sdk | jq '.versions | keys'

# Check a specific dependency's version
curl -s https://registry.npmjs.org/@servicenow/sdk-cli/4.5.0 | jq '.dependencies'`}
          />
        </SubSection>

        <SubSection label="Method 2: npm pack — download and inspect dist/">
          <CodeBlock
            language="bash"
            filename="terminal"
            code={`# Download the tarball WITHOUT installing
npm pack @servicenow/sdk-cli@4.5.0

# Extract it
tar -xzf servicenow-sdk-cli-4.5.0.tgz

# Browse the compiled output
ls package/dist/command/                 # each snc subcommand
ls package/dist/logger/                  # internal helpers
cat package/dist/command/build/index.js | head -60  # read the build handler`}
          />
        </SubSection>

        <SubSection label="Method 3: trace a command end-to-end">
          <CodeBlock
            language="bash"
            filename="tracing snc build through the package graph"
            showLineNumbers={false}
            code={`snc build
  → node ./dist/cli/index.js build          (@servicenow/sdk bin)
  → yargs finds command/build/index.js      (@servicenow/sdk-cli)
  → handler calls buildPipeline()
  → buildPipeline imports sdk-build-core    (@servicenow/sdk-build-core)
  → core instantiates Project (ts-morph)
  → scans .ts files, collects exports
  → for each export, looks up plugin
  → plugin from sdk-build-plugins validates + transforms
  → plugin calls sdk-core schemas (zod)     (@servicenow/sdk-core)
  → xmlbuilder2 serializes to Update Set XML
  → output written to metadata/`}
          />
        </SubSection>

        <SubSection label="Method 4: check what's actually installed">
          <CodeBlock
            language="bash"
            filename="terminal"
            code={`# After npm install @servicenow/sdk in any project:
ls node_modules/@servicenow/

# You should see all sub-packages installed as hoisted deps:
# glide/    sdk-api/    sdk-build-core/    sdk-build-plugins/
# sdk-cli/  sdk-core/

# Check resolved versions (confirms what actually installed)
cat node_modules/@servicenow/sdk-cli/package.json | jq '.version'

# Inspect sdk-core's massive file count
find node_modules/@servicenow/sdk-core/src -name '*.ts' | wc -l`}
          />
        </SubSection>
      </Section>

      {/* ── Package size considerations ── */}
      <Section title="Package Size Budget — Why It Matters">
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                {['Package', 'Unpacked', 'Install impact', 'Notes'].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '7px 12px 7px 0', color: 'var(--color-text-primary)', fontWeight: 600 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                ['@servicenow/sdk',          '~0.5 MB', 'transitive only',    'Thin wrapper; size is the sum of sub-packages'],
                ['@servicenow/sdk-core',      '~6 MB',   '++ type definitions', '1,635 files; grows as new metadata types ship'],
                ['@servicenow/sdk-api',       '~2.4 MB', '++ deployment logic', '140 files; includes all Handlebars templates'],
                ['@servicenow/sdk-cli',       '~1.2 MB', '+ CLI handlers',      'yargs, winston, chalk add ~400 KB'],
                ['@servicenow/sdk-build-core','~3 MB',   '+++ ts-morph',        'ts-morph 24 alone is ~2 MB'],
                ['@servicenow/sdk-build-plugins','~2 MB','++ ESLint + CycloneDX','ESLint 9 flat config adds ~800 KB'],
                ['@servicenow/glide',         '~4 MB',   '+ type decls only',   'Pure .d.ts; zero runtime bytes'],
              ].map(([pkg, size, impact, notes]) => (
                <tr key={pkg} style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <td style={{ padding: '8px 12px 8px 0', fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--color-sn-green-light)' }}>{pkg}</td>
                  <td style={{ padding: '8px 12px 8px 0', fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--color-text-secondary)' }}>{size}</td>
                  <td style={{ padding: '8px 12px 8px 0', fontSize: '12px', color: 'var(--color-text-secondary)' }}>{impact}</td>
                  <td style={{ padding: '8px 0', fontSize: '12px', color: 'var(--color-text-tertiary)', fontWeight: 300 }}>{notes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Callout type="tip" title="CI install time">
          In CI pipelines, <code>npm ci</code> with a warmed cache installs the full SDK in
          under 10 seconds. On a cold cache (first run), plan for 45–90 seconds due to ts-morph
          and sdk-core extraction. Use <code>npm ci --prefer-offline</code> with a cached
          <code>node_modules</code> layer in Docker to bring this under 5 seconds.
        </Callout>
      </Section>

      {/* ── Key takeaways ── */}
      <Section title="Key Takeaways">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
          {[
            { pkg: '@servicenow/sdk',           insight: 'Thin umbrella. Three binaries: sdk, now-sdk (alias), now-sdk-debug. Browser + Node dual exports on ./api. Uses undici for all HTTP.' },
            { pkg: '@servicenow/sdk-core',       insight: '1,635 files, 6 MB. One dep: zod. Every metadata type is a Zod schema — validation and TypeScript types from the same definition.' },
            { pkg: '@servicenow/sdk-build-core', insight: 'The compiler. ts-morph reads your TS source statically. xmlbuilder2 produces Update Set XML. vscode-languageserver powers IDE integration.' },
            { pkg: '@servicenow/sdk-build-plugins', insight: 'The plugin registry. ESLint 9 for SDK-specific lint rules. CycloneDX for SBOM. Depends on @servicenow/glide to validate Glide API usage at build time.' },
            { pkg: '@servicenow/sdk-api',        insight: '140 files, 2.4 MB. Handlebars templates for scaffolding. crypto-js for browser-compatible auth. fast-xml-parser for reading instance responses.' },
            { pkg: '@servicenow/sdk-cli',        insight: 'yargs commands + winston logs + chalk colors. v4.0: keytar removed, openid-client added — OAuth 2.0 now works in Docker/CI without keychain daemons.' },
            { pkg: '@servicenow/glide',          insight: 'v27.0.5 — versioned to platform release train, not SDK. Zero production deps. Types generated by ts-morph from platform schema + ctix for barrel exports.' },
          ].map(({ pkg, insight }) => (
            <div key={pkg} style={{
              background: 'var(--color-surface-raised)',
              border: '1px solid var(--color-border)',
              borderRadius: '8px',
              padding: '14px 16px',
            }}>
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--color-sn-green-light)', marginBottom: '6px', fontWeight: 600 }}>{pkg}</p>
              <p style={{ fontFamily: 'var(--font-sans)', fontSize: '12px', color: 'var(--color-text-secondary)', lineHeight: '1.6', fontWeight: 300, margin: 0 }}>{insight}</p>
            </div>
          ))}
        </div>
      </Section>

    </div>
  )
}

function Section({ title, children }) {
  return (
    <section>
      <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '22px', fontWeight: 500, color: 'var(--color-text-primary)', marginBottom: '16px', lineHeight: 1.3 }}>{title}</h2>
      <div style={{ fontSize: '14px', lineHeight: '1.7', color: 'var(--color-text-secondary)' }}>
        {children}
      </div>
    </section>
  )
}

function SubSection({ label, children }) {
  return (
    <div style={{ marginBottom: '22px' }}>
      <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--color-text-tertiary)', marginBottom: '10px' }}>
        {label}
      </p>
      {children}
    </div>
  )
}
