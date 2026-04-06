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
