import undici from './npm-knowledge/undici.md?raw'

export default function Ch17({ CodeBlock, Callout }) {
  return (
    <div className="space-y-8">
      <Section title="Overview">
        <p>
          Deep dive into <code>undici</code>: the HTTP transport used by SDK layers to perform
          high-throughput instance communication with pooling and Fetch-compatible semantics.
        </p>
      </Section>

      <Section title="High-level Diagram">
        <img src="/diagrams/undici.svg" alt="undici transport in SDK" style={{ width: '100%', maxWidth: 680, borderRadius: 8, border: '1px solid var(--color-border)' }} />
      </Section>

      <Section title="Canonical Notes">
        <CodeBlock
          language="markdown"
          filename="portal/src/content/npm-knowledge/undici.md"
          showLineNumbers={false}
          code={undici}
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
