import sdkCli from './npm-knowledge/sdk-cli.md?raw'

export default function Ch13({ CodeBlock, Callout }) {
  return (
    <div className="space-y-8">
      <Section title="Overview">
        <p>
          Deep dive into <code>@servicenow/sdk-cli</code>: command parsing, UX prompts, logging,
          and how the CLI orchestrates builds and installs via <code>@servicenow/sdk-api</code>.
        </p>
      </Section>

      <Section title="High-level Diagram">
        <img src="/diagrams/sdk-cli.svg" alt="@servicenow/sdk-cli sequence" style={{ width: '100%', maxWidth: 680, borderRadius: 8, border: '1px solid var(--color-border)' }} />
      </Section>

      <Section title="Canonical Notes">
        <CodeBlock
          language="markdown"
          filename="portal/src/content/npm-knowledge/sdk-cli.md"
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
