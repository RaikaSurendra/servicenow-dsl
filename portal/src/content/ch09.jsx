export default function Ch09({ CodeBlock, Callout }) {
  return (
    <div className="space-y-10">

      <Section title="Overview">
        <p>
          The <code>@servicenow/sdk</code> is not just a CLI — it is a full <strong>metadata compiler</strong>.
          It takes TypeScript source written in the Fluent DSL and produces ServiceNow XML update-set
          artifacts that the platform deploys natively. Understanding how this pipeline works makes you
          dramatically more effective at debugging builds, extending the SDK, and reasoning about what
          your code actually becomes.
        </p>
        <Callout type="info">
          The analysis in this chapter is based on the public GitHub repository at{' '}
          <code>github.com/ServiceNow/sdk</code>, the npm package code tab, release notes, and
          community deep-dives. Not all internals are publicly documented — some sections reflect
          informed inference from the public API surface.
        </Callout>
      </Section>

      {/* ── Architecture ── */}
      <Section title="Architecture — Six Layers">
        <p>The SDK composes into six distinct layers, each with a clear responsibility:</p>
        <CodeBlock
          language="bash"
          filename="architecture"
          showLineNumbers={false}
          code={`┌─────────────────────────────────────────────────────────┐
│            DEVELOPER INTERFACE LAYER                    │
│  TypeScript Fluent DSL (.now.ts files)                  │
│  Human-readable, version-controlled, AI-friendly        │
├─────────────────────────────────────────────────────────┤
│            COMPILER LAYER  (@servicenow/sdk)            │
│  Plugin framework · AST parser · Metadata registry      │
├─────────────────────────────────────────────────────────┤
│            INTERMEDIATE REPRESENTATION                   │
│  Normalized metadata objects · Dependency graph          │
│  Transform rules · Validation                            │
├─────────────────────────────────────────────────────────┤
│            XML GENERATION & SERIALIZATION                │
│  Update Set XML (sys_*.xml) · CDATA wrapping            │
│  Binary attachments · File structure                     │
├─────────────────────────────────────────────────────────┤
│            CLI & DEPLOYMENT  (snc)                       │
│  init · build · install · deploy · pack · transform     │
│  Auth management · Instance sync · Dev server           │
├─────────────────────────────────────────────────────────┤
│            SERVICENOW PLATFORM                          │
│  Scoped application container                           │
│  Metadata store · Script execution runtime              │
└─────────────────────────────────────────────────────────┘`}
        />
      </Section>

      {/* ── Core packages ── */}
      <Section title="Package Responsibilities">
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                {['Package', 'Version', 'Role'].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '8px 12px 8px 0', color: 'var(--color-text-primary)', fontWeight: 600 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                ['@servicenow/sdk',      'v4.5.x', 'Main CLI, build orchestrator, plugin host, XML generator'],
                ['@servicenow/sdk-core', 'v4.5.x', 'Fluent API function definitions, type system, metadata schemas'],
                ['@servicenow/glide',    'v27.x',  'Ambient TypeScript types for all Glide Scriptable APIs (GlideRecord, GlideSystem, etc.)'],
              ].map(([pkg, ver, role]) => (
                <tr key={pkg} style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <td style={{ padding: '10px 12px 10px 0', fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--color-sn-green-light)' }}>{pkg}</td>
                  <td style={{ padding: '10px 12px 10px 0', fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--color-text-secondary)' }}>{ver}</td>
                  <td style={{ padding: '10px 0', color: 'var(--color-text-secondary)', fontWeight: 300 }}>{role}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      {/* ── Fluent DSL internals ── */}
      <Section title="How the Fluent DSL Works Internally">
        <p>
          The most important thing to understand: <strong>calling a Fluent function does not execute code</strong>.
          It <em>describes metadata</em>. When you write <code>table({'{}'})</code>, you are producing a
          configuration object — not running a business rule or creating a database table.
        </p>
        <CodeBlock
          language="js"
          filename="what table() actually does"
          code={`// What you write:
export default table({
  name: 'x_vuln_finding',
  label: 'CVE Finding',
  fields: {
    cve_id: field.string({ label: 'CVE ID', mandatory: true }),
    severity: field.choice({ ... }),
  }
})

// What table() returns (simplified):
{
  __metadata_type: 'table',
  __sdk_version: '4.5.x',
  name: 'x_vuln_finding',
  label: 'CVE Finding',
  fields: {
    cve_id: { type: 'string', label: 'CVE ID', mandatory: true },
    severity: { type: 'choice', choices: [...] },
  }
}

// At build time, the SDK's static analyzer:
// 1. Scans all .ts files for top-level exports
// 2. Finds objects with __metadata_type set
// 3. Adds them to the build registry
// 4. Validates against platform rules
// 5. Generates XML`}
        />
        <Callout type="tip">
          Scripts embedded inside Fluent definitions (e.g., business rule logic) are treated as
          <strong> string source code</strong>, not as executable JavaScript. They are wrapped in
          CDATA blocks in the output XML and executed later by ServiceNow's own runtime.
        </Callout>
      </Section>

      {/* ── Build pipeline ── */}
      <Section title="The Three-Stage Build Pipeline">
        <p>
          <code>snc build</code> runs three sequential stages. Each stage transforms the output of
          the previous one.
        </p>

        <SubSection label="Stage 1 — Source → Normalized Metadata">
          <CodeBlock
            language="bash"
            filename="stage 1"
            showLineNumbers={false}
            code={`TypeScript source (.now.ts files)
  ↓ TypeScript parser (esbuild / ts-node)
  ↓ AST analysis — extract top-level exports
  ↓ Filter: only objects with known __metadata_type
  ↓ Validate: type correctness, mandatory fields
  ↓ Build dependency graph (which tables ref which?)
Normalized metadata objects (in-memory)`}
          />
        </SubSection>

        <SubSection label="Stage 2 — Metadata → XML">
          <CodeBlock
            language="bash"
            filename="stage 2"
            showLineNumbers={false}
            code={`Normalized metadata objects + dependency graph
  ↓ Transform engine (rules-based, plugin-driven)
  ↓ Special handling:
      • CDATA wrapping for script source code
      • Binary files → base64 attachments
      • Third-party npm packages → XML resources
      • Frontend bundles (React/Vue) → Rollup → embed
  ↓ Serialize each record to sys_*.xml
Update Set XML files in metadata/ directory`}
          />
        </SubSection>

        <SubSection label="Stage 3 — XML → Deployed to Instance">
          <CodeBlock
            language="bash"
            filename="stage 3"
            showLineNumbers={false}
            code={`Built artifacts (metadata/*.xml)
  ↓ snc install / snc deploy
  ↓ Create Update Set on your PDI
  ↓ Load XML records into Update Set container
  ↓ Preview (validate no conflicts)
  ↓ Commit Update Set
Scoped application metadata updated on platform`}
          />
        </SubSection>
      </Section>

      {/* ── Plugin registry ── */}
      <Section title="Plugin Framework (v4.0 Overhaul)">
        <p>
          Before v4.0, adding a new metadata type to the SDK required changes deep in the core.
          The v4.0 plugin framework decoupled type registration from core code, making it both
          faster to ship new types and more reliable across versions.
        </p>
        <CodeBlock
          language="js"
          filename="plugin registration pattern (conceptual)"
          code={`// Each metadata type registers itself with the framework
registerMetadataPlugin({
  type: 'table',

  // 1. Validate the developer's definition
  validate(spec) {
    if (!spec.name) throw new Error('table.name is required')
    if (!spec.name.startsWith('x_')) throw new Error('name must be scoped')
  },

  // 2. Resolve dependencies (what this type references)
  resolveDeps(spec) {
    return spec.fields
      .filter(f => f.type === 'reference')
      .map(f => ({ type: 'table', name: f.refTable }))
  },

  // 3. Transform to XML
  toXml(spec, context) {
    return \`<record_update table="sys_db_object">
  <sys_db_object action="INSERT_OR_UPDATE">
    <name>\${context.scope}_\${spec.name}</name>
    <label>\${spec.label}</label>
    ...
  </sys_db_object>
</record_update>\`
  },
})`}
        />
        <p>
          This pattern is similar to Babel plugins or webpack loaders — the core provides the
          infrastructure; plugins provide type-specific knowledge.
        </p>
      </Section>

      {/* ── Visitor pattern ── */}
      <Section title="Visitor Pattern for Code Generation">
        <p>
          The build pipeline uses multiple passes over the same metadata graph, each extracting
          different information. This maps closely to the <strong>Visitor pattern</strong>:
        </p>
        <CodeBlock
          language="js"
          filename="multi-pass visitor (conceptual)"
          code={`const registry = collectAllMetadata(sourceFiles)

// Each visitor does one job — decoupled, composable
const visitors = [
  new ValidationVisitor(),     // enforce rules, throw on errors
  new DependencyVisitor(),     // build dep graph, order XML output
  new XmlGenerationVisitor(),  // produce sys_*.xml files
  new TypeDefinitionVisitor(), // produce .d.ts for IDE support
]

for (const visitor of visitors) {
  for (const metadataNode of registry.topologicalOrder()) {
    metadataNode.accept(visitor)
  }
}`}
        />
      </Section>

      {/* ── CLI commands deep dive ── */}
      <Section title="CLI Command Internals">
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                {['Command', 'What it does internally'].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '8px 12px 8px 0', color: 'var(--color-text-primary)', fontWeight: 600 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                ['snc init', 'Scaffolds project.json, tsconfig.json, now.config.js, src/ structure. Prompts for app name, scope, vendor prefix.'],
                ['snc build', 'Runs the 3-stage pipeline. Outputs to metadata/. No network calls.'],
                ['snc install', 'Runs build, then deploys XML to your PDI. Also auto-publishes Flows (v4.5+).'],
                ['snc deploy', 'Deploy without rebuild — pushes existing metadata/ artifacts.'],
                ['snc download', 'Fetches XML from instance → local files. Inverse of deploy.'],
                ['snc transform', 'Attempts to convert downloaded XML into Fluent DSL. Incomplete for complex types.'],
                ['snc dependencies', 'Scans src/ for x_require() calls, downloads Script Include defs, generates .d.ts for IDE autocomplete.'],
                ['snc pack', 'Packages the app into an installable .zip archive. Used for distribution.'],
                ['snc clean', 'Deletes metadata/ build artifacts. Safe to run; doesn\'t touch source.'],
              ].map(([cmd, desc]) => (
                <tr key={cmd} style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <td style={{ padding: '10px 16px 10px 0', fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--color-sn-green-light)', whiteSpace: 'nowrap', verticalAlign: 'top' }}>{cmd}</td>
                  <td style={{ padding: '10px 0', color: 'var(--color-text-secondary)', fontWeight: 300, lineHeight: '1.55' }}>{desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      {/* ── Scope isolation ── */}
      <Section title="Scope Isolation & Cross-Scope Modules">
        <p>
          Every ServiceNow application lives in a <strong>scoped namespace</strong>. The SDK
          enforces scope prefixes automatically — you never write <code>x_myapp_table</code>
          manually; the build tool prepends the scope for you.
        </p>
        <CodeBlock
          language="js"
          filename="scope isolation model"
          code={`// Your source (scope: x_vuln_container)
export default table({
  name: 'finding',   // ← you write the short name
  ...
})

// Generated XML table name:
// x_vuln_container_finding   ← SDK prefixes the scope

// Cross-scope access — reading another app's Script Include
const IncidentUtils = x_require('x_other_app.IncidentUtils')

// snc dependencies detects this x_require() and:
// 1. Downloads IncidentUtils definition from your PDI
// 2. Generates x_other_app.d.ts with TypeScript types
// 3. IDE can now autocomplete IncidentUtils methods`}
        />
        <Callout type="warning">
          Functions imported cross-scope via <code>x_require()</code> <strong>cannot use async/await</strong>.
          ServiceNow's synchronous execution model and security restrictions on cross-scope calls
          forbid it. The SDK will throw a build error if async is detected in an exported cross-scope function.
        </Callout>
      </Section>

      {/* ── Property strictness ── */}
      <Section title="Property Strictness (v4.4+)">
        <p>
          Before v4.4, passing an unknown property to a Fluent function was silently ignored. This
          caused subtle bugs where configuration appeared correct but had no effect.
        </p>
        <CodeBlock
          language="js"
          filename="property strictness — before and after v4.4"
          code={`// BEFORE v4.4 — silently ignored
table({
  name: 'my_table',
  labal: 'My Table',   // ← typo! no error, no effect
})

// AFTER v4.4 — TypeScript compile error
table({
  name: 'my_table',
  labal: 'My Table',   // ← Error: Object literal may only specify known properties
  //     ^^^^^  Did you mean 'label'?
})`}
        />
      </Section>

      {/* ── Frontend bundles ── */}
      <Section title="Frontend Assets — How React Gets Into ServiceNow">
        <p>
          UiPage supports React, Vue, Svelte, and SolidJS. The SDK handles the bundling pipeline
          automatically:
        </p>
        <CodeBlock
          language="bash"
          filename="frontend asset pipeline"
          showLineNumbers={false}
          code={`React/Vue/Svelte source
  ↓ Rollup bundler (configured by SDK)
  ↓ Tree-shake + minify
  ↓ Single bundle file (no code splitting for UiPage)
  ↓ Base64 encode OR file attachment
  ↓ Embed in sys_ui_page.xml as CDATA
Deployed as a single XML record`}
        />
        <Callout type="warning" title="Frontend Constraints">
          Hash-based routing only (no <code>history</code> mode). No CSS modules. No SSR. The entire
          frontend app is bundled into one XML record — keep bundles lean. The local dev server
          (v4.4+) proxies API calls to your PDI so you can develop without redeploying.
        </Callout>
      </Section>

      {/* ── Version history ── */}
      <Section title="v4.x Evolution — What Changed and Why">
        {[
          {
            version: 'v4.0', date: 'Sept 2024', headline: 'Front-End Revolution',
            changes: [
              'Plugin framework complete overhaul — more reliable, faster to ship new types',
              'React / Vue / Svelte / SolidJS support via UiPage',
              'New CLI commands: clean, pack, download',
              'Developers can now build full-stack SN apps locally without the IDE',
            ]
          },
          {
            version: 'v4.1', date: 'Nov 2024', headline: 'Developer Experience',
            changes: [
              'Module inclusion / exclusion patterns for selective builds',
              'Template system — apply templates to existing projects',
              'Script include type generation improvements',
            ]
          },
          {
            version: 'v4.2', date: 'Jan 2025', headline: 'Type Safety Expansion',
            changes: [
              'ImportSet API — define transform maps and field mappings in code',
              'UiPolicy API — form field visibility and control',
              'Generic GlideRecord: GlideRecord<"incident"> enables table-aware type checking',
              'Duration/Time helpers for complex ServiceNow field types',
              'snc dependencies command — auto-generate .d.ts from live instance',
            ]
          },
          {
            version: 'v4.3', date: 'Feb 2025', headline: 'Workflow-as-Code',
            changes: [
              'Flow API MVP — build complete workflows entirely in TypeScript',
              'Triggers: record events, scheduled, application-based',
              'Actions: CRUD, communication, attachments — all type-safe',
              '31 new Service Catalog variable types',
              'Major performance gains in build and transform steps',
            ]
          },
          {
            version: 'v4.4', date: 'Mar 2025', headline: 'Developer Velocity',
            changes: [
              'Front-end dev server — local development without instance deployment each change',
              'Request proxying to PDI, hot-reload capabilities',
              'Service Catalog: flow-triggered items, getCatalogVariables actions',
              'Property strictness enforcement — catch typos at compile time',
            ]
          },
          {
            version: 'v4.5', date: 'Mar 2025', headline: 'AI Integration & Monitoring',
            changes: [
              'Instance Scan APIs for runtime anomaly detection',
              'Now Assist Skill Kit — configure AI skills in code',
              'AI Agent Studio — define agents and workflows programmatically',
              'Flow auto-publishing — snc install publishes flows automatically',
              'Service Portal expansion: pages, themes, widgets, menus',
              'ESLint v9 support, removed old dependency cruft',
            ]
          },
        ].map(({ version, date, headline, changes }) => (
          <div key={version} style={{ marginBottom: '28px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', fontWeight: 600, color: 'var(--color-sn-green-light)' }}>{version}</span>
              <span style={{ fontFamily: 'var(--font-serif)', fontSize: '16px', fontWeight: 500, color: 'var(--color-text-primary)' }}>{headline}</span>
              <span style={{ fontFamily: 'var(--font-sans)', fontSize: '11px', color: 'var(--color-text-tertiary)', marginLeft: 'auto' }}>{date}</span>
            </div>
            <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
              {changes.map((c, i) => (
                <li key={i} style={{ display: 'flex', gap: '10px', fontSize: '13px', color: 'var(--color-text-secondary)', marginBottom: '4px', fontWeight: 300, lineHeight: '1.5' }}>
                  <span style={{ color: 'var(--color-text-tertiary)', flexShrink: 0 }}>–</span>
                  {c}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </Section>

      {/* ── Comparison ── */}
      <Section title="SDK vs. Other Code Generation Tools">
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                {['Tool', 'Input', 'Output', 'Analogy'].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '8px 12px 8px 0', color: 'var(--color-text-primary)', fontWeight: 600 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                ['@servicenow/sdk', 'TypeScript (Fluent DSL)', 'XML update sets', 'Terraform for ServiceNow'],
                ['Terraform', 'HCL', 'Cloud API calls', '—'],
                ['Protobuf / gRPC', '.proto files', 'Language stubs', 'Different output, same paradigm'],
                ['GraphQL Codegen', 'GraphQL schema', 'TypeScript types', 'Schema → artifacts'],
                ['Helm', 'YAML templates', 'Kubernetes YAML', 'Template → manifest'],
              ].map(([tool, input, output, analogy]) => (
                <tr key={tool} style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <td style={{ padding: '9px 12px 9px 0', fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--color-sn-green-light)' }}>{tool}</td>
                  <td style={{ padding: '9px 12px 9px 0', color: 'var(--color-text-secondary)', fontWeight: 300 }}>{input}</td>
                  <td style={{ padding: '9px 12px 9px 0', color: 'var(--color-text-secondary)', fontWeight: 300 }}>{output}</td>
                  <td style={{ padding: '9px 0', color: 'var(--color-text-tertiary)', fontWeight: 300, fontStyle: 'italic' }}>{analogy}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      {/* ── Key patterns ── */}
      <Section title="Key Architectural Patterns Summary">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '12px', marginTop: '8px' }}>
          {[
            { pattern: 'Plugin Registry', purpose: 'Each metadata type registers its own validate → deps → toXml rules. Core stays lean.' },
            { pattern: 'Visitor Pattern', purpose: 'Multiple passes over the metadata graph: validation, deps, XML, .d.ts generation.' },
            { pattern: 'Static Analysis', purpose: 'No runtime decorators. Parser scans exports at build time — no app startup needed.' },
            { pattern: 'Declarative DSL', purpose: 'Fluent calls describe, they do not execute. Scripts are string source, not functions.' },
            { pattern: 'Scope Enforcement', purpose: 'SDK auto-prepends your app scope to all table/script names. You write the short name.' },
            { pattern: 'Bidirectional Sync', purpose: 'build → deploy goes code→XML→instance; download goes instance→XML→(transform)→code.' },
            { pattern: 'Immutable Specs', purpose: 'Metadata objects are frozen after definition. No mutation after declaration.' },
            { pattern: 'Type Inference', purpose: 'GlideRecord<"incident"> gives table-aware field autocomplete via generated .d.ts files.' },
          ].map(({ pattern, purpose }) => (
            <div key={pattern} style={{
              background: 'var(--color-surface-raised)',
              border: '1px solid var(--color-border)',
              borderRadius: '8px',
              padding: '16px',
            }}>
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--color-sn-green-light)', marginBottom: '6px', fontWeight: 600 }}>{pattern}</p>
              <p style={{ fontFamily: 'var(--font-sans)', fontSize: '12px', color: 'var(--color-text-secondary)', lineHeight: '1.55', fontWeight: 300, margin: 0 }}>{purpose}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* ── Known limitations ── */}
      <Section title="Known Limitations">
        <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
          {[
            ['snc transform is incomplete', 'Reverse-compiling instance XML to Fluent DSL works for simple types (basic tables, fields) but fails for Flows, complex UI components, and many advanced types.'],
            ['No async in cross-scope imports', 'x_require()\'d modules cannot use async/await. ServiceNow\'s synchronous execution model prohibits it.'],
            ['Frontend hash routing only', 'UiPage-based SPAs must use hash routing (#/path). No browser History API support.'],
            ['Dev server is new-project only', 'The v4.4 local dev server only works for newly scaffolded projects. Backport to existing projects is in progress.'],
            ['No state backend', 'Unlike Terraform, the SDK does not maintain a state file. Deletes require snc build --generate-deletes — they are not automatic.'],
          ].map(([title, desc], i) => (
            <li key={i} style={{ display: 'flex', gap: '14px', marginBottom: '14px', alignItems: 'flex-start' }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--color-critical)', flexShrink: 0, marginTop: '2px' }}>!</span>
              <div>
                <p style={{ fontFamily: 'var(--font-sans)', fontSize: '13px', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '3px' }}>{title}</p>
                <p style={{ fontFamily: 'var(--font-sans)', fontSize: '13px', color: 'var(--color-text-secondary)', fontWeight: 300, lineHeight: '1.55', margin: 0 }}>{desc}</p>
              </div>
            </li>
          ))}
        </ul>
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
    <div style={{ marginBottom: '20px' }}>
      <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--color-text-tertiary)', marginBottom: '8px' }}>
        {label}
      </p>
      {children}
    </div>
  )
}
