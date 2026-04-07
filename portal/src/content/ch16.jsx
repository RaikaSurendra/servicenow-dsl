import glide from './npm-knowledge/glide.md?raw'

export default function Ch16({ CodeBlock, Callout }) {
  return (
    <div className="space-y-8">
      <Section title="Overview">
        <p>
          Deep dive into <code>@servicenow/glide</code>: the declaration package for Glide Scriptable APIs
          that powers editor IntelliSense and compile-time checks across the SDK.
        </p>
      </Section>

      <Section title="High-level Diagram">
        <img src="/diagrams/glide.svg" alt="@servicenow/glide type declarations" style={{ width: '100%', maxWidth: 680, borderRadius: 8, border: '1px solid var(--color-border)' }} />
      </Section>

      <Section title="Canonical Notes">
        <CodeBlock
          language="markdown"
          filename="portal/src/content/npm-knowledge/glide.md"
          showLineNumbers={false}
          code={glide}
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
