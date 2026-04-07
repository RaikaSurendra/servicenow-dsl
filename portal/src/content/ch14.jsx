import sdkCore from './npm-knowledge/sdk-core.md?raw'

export default function Ch14({ CodeBlock, Callout }) {
  return (
    <div className="space-y-8">
      <Section title="Overview">
        <p>
          Deep dive into <code>@servicenow/sdk-core</code>: shared schemas, types, and validation
          contracts that power the compiler and API layers.
        </p>
      </Section>

      <Section title="High-level Diagram">
        <img src="/diagrams/sdk-core.svg" alt="@servicenow/sdk-core contracts" style={{ width: '100%', maxWidth: 680, borderRadius: 8, border: '1px solid var(--color-border)' }} />
      </Section>

      <Section title="Canonical Notes">
        <CodeBlock
          language="markdown"
          filename="portal/src/content/npm-knowledge/sdk-core.md"
          showLineNumbers={false}
          code={sdkCore}
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
