import sdkUmbrella from './npm-knowledge/sdk-umbrella.md?raw'

export default function Ch11({ CodeBlock, Callout }) {
  return (
    <div className="space-y-8">
      <Section title="Overview">
        <p>
          Deep dive into the umbrella package <code>@servicenow/sdk</code>: what ships in the tarball,
          how the exports map is structured, and how the umbrella composes CLI, API, and Core layers.
        </p>
      </Section>

      <Section title="High-level Diagram">
        <img src="/diagrams/sdk-umbrella.svg" alt="@servicenow/sdk umbrella composition" style={{ width: '100%', maxWidth: 680, borderRadius: 8, border: '1px solid var(--color-border)' }} />
      </Section>

      <Section title="Canonical Notes">
        <CodeBlock
          language="markdown"
          filename="portal/src/content/npm-knowledge/sdk-umbrella.md"
          showLineNumbers={false}
          code={sdkUmbrella}
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
