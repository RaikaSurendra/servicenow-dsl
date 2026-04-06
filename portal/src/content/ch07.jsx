export default function Ch07({ CodeBlock, Callout }) {
  return (
    <div className="space-y-8">
      <Callout type="warning" title="Community Package">
        <code>@modesty/fluent-mcp</code> is community-maintained. It requires Node.js ≥ 22.15.1
        and npm ≥ 11.4.1. Verify these before proceeding.
      </Callout>

      <Section title="Overview">
        <p>
          <strong>@modesty/fluent-mcp</strong> is a <em>Model Context Protocol (MCP)</em> server
          that exposes all ServiceNow Fluent SDK CLI commands and 48+ metadata type specifications
          to AI assistants like Claude, GitHub Copilot (VS Code Agent), Cursor, and Windsurf.
        </p>
        <p className="mt-2">
          In practice this means your AI assistant knows the exact schema for every ServiceNow
          metadata type and can generate valid Fluent DSL code without hallucinating APIs.
        </p>
      </Section>

      <Section title="MCP architecture in practice">
        <CodeBlock
          language="bash"
          filename="assistant + MCP flow"
          showLineNumbers={false}
          code={`Developer prompt
  -> AI assistant plans metadata changes
  -> MCP tool call to fluent-mcp
  -> fluent-mcp resolves SDK schemas + command interfaces
  -> assistant generates Fluent DSL with validated structure
  -> developer reviews + builds + deploys`}
        />
        <p className="text-sm mt-2" style={{ color: 'var(--color-text-muted)' }}>
          The key value is schema-grounding: the assistant can query structured metadata definitions
          instead of guessing syntax from general web patterns.
        </p>
      </Section>

      <Section title="Install">
        <CodeBlock
          language="bash"
          filename="terminal"
          code={`# Check Node and npm versions
node --version   # must be >= 22.15.1
npm --version    # must be >= 11.4.1

# Test MCP server without installing (recommended first)
npx @modelcontextprotocol/inspector npx @modesty/fluent-mcp

# Or install globally
npm install -g @modesty/fluent-mcp`}
        />
      </Section>

      <Section title="Configure in Claude Desktop">
        <CodeBlock
          language="js"
          filename="~/Library/Application Support/Claude/claude_desktop_config.json"
          code={`{
  "mcpServers": {
    "fluent-mcp": {
      "command": "npx",
      "args": ["@modesty/fluent-mcp"]
    }
  }
}`}
        />
        <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
          Restart Claude Desktop after saving. You should see <strong>fluent-mcp</strong> in the
          tool list.
        </p>
      </Section>

      <Section title="Configure in VS Code (Agent mode)">
        <CodeBlock
          language="js"
          filename=".vscode/mcp.json"
          code={`{
  "servers": {
    "fluent-mcp": {
      "type": "stdio",
      "command": "npx",
      "args": ["@modesty/fluent-mcp"]
    }
  }
}`}
        />
      </Section>

      <Section title="What the MCP server exposes">
        <div className="grid grid-cols-2 gap-2 text-xs font-mono mt-2">
          {[
            'snc init', 'snc build', 'snc install', 'snc clean',
            'snc pack', 'snc transform', 'snc download', 'snc dependencies',
            '48+ metadata type schemas', 'Code snippet generation',
            'Validation rules', 'Field type references',
          ].map((item) => (
            <div
              key={item}
              className="px-2 py-1.5 rounded"
              style={{ background: 'var(--color-surface-overlay)', color: 'var(--color-text-muted)' }}
            >
              {item}
            </div>
          ))}
        </div>
      </Section>

      <Section title="Secure and reliable MCP operations">
        <ul className="list-disc list-inside space-y-1 text-sm" style={{ color: 'var(--color-text-muted)' }}>
          <li>Pin MCP package versions in team docs to avoid behavior drift</li>
          <li>Do not expose instance credentials in prompts; keep secrets in <code>.env</code> only</li>
          <li>Review generated code in PRs just like human-authored code</li>
          <li>Require <code>snc app build</code> in CI to block schema-invalid outputs</li>
          <li>Log generated artifacts and prompt intent for auditability</li>
        </ul>
      </Section>

      <Section title="Prompt engineering for deterministic output">
        <CodeBlock
          language="bash"
          filename="high-signal MCP prompt template"
          showLineNumbers={false}
          code={`Generate Fluent SDK code for <feature> with these constraints:
- Scope: x_<company>_<app>
- Metadata types allowed: table, restAPI, scriptInclude
- Validation: include mandatory fields and explicit defaults
- Error handling: structured { error: { message, status } } responses
- Output format: complete file tree + each file content
- Verification: include snc build command and expected checks`}
        />
      </Section>

      <Section title="Governance model for AI-generated Fluent code">
        <CodeBlock
          language="bash"
          filename="team guardrails"
          showLineNumbers={false}
          code={`1) AI generates first draft via fluent-mcp
2) Developer verifies metadata names/scope consistency
3) Static checks: lint + typecheck + snc app build
4) Security review for ACLs and data exposure
5) Deploy to PDI only after manual approval`}
        />
      </Section>

      <Section title="Example prompt with fluent-mcp active">
        <CodeBlock
          language="bash"
          filename="AI prompt (Claude / Cursor / Copilot)"
          showLineNumbers={false}
          code={`Create a ServiceNow Scripted REST API using the Fluent SDK that:
- Base path: /containers/vulnerabilities
- GET /  → returns all critical CVEs from x_vuln_finding table
- POST / → accepts a CVE payload and creates a new finding record
- Use @servicenow/glide types for GlideRecord
- Follow the now.config.js pattern for instance connection`}
        />
        <p className="text-sm mt-2" style={{ color: 'var(--color-text-muted)' }}>
          With <code>fluent-mcp</code> active, the AI has precise knowledge of the Fluent DSL
          schema and generates syntactically valid code — no hallucinated APIs.
        </p>
      </Section>

      <Callout type="tip" title="Best practice">
        Use <code>fluent-mcp</code> for code generation scaffolding, then review the output
        against the official SDK docs before deploying. AI tools accelerate the first draft;
        you own the final code.
      </Callout>

      <Section title="Key Takeaways">
        <ul className="list-disc list-inside space-y-1 text-sm" style={{ color: 'var(--color-text-muted)' }}>
          <li>MCP = a protocol for AI tools to consume structured tool/schema knowledge</li>
          <li><code>fluent-mcp</code> gives AI assistants accurate ServiceNow SDK context</li>
          <li>Works with Claude Desktop, VS Code Agent, Cursor, and Windsurf</li>
          <li>Always review AI-generated Fluent code before deploying to your PDI</li>
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
