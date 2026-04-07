import sdkBuildPlugins from './npm-knowledge/sdk-build-plugins.md?raw'

export default function Ch15({ CodeBlock, Callout }) {
  return (
    <div className="space-y-8">
      <Section title="Overview">
        <p>
          Deep dive into <code>@servicenow/sdk-build-plugins</code>: record transformers, validators,
          and how plugin execution flows shape the compiled artifact set.
        </p>
      </Section>

      <Section title="High-level Diagram">
        <img src="/diagrams/sdk-build-plugins.svg" alt="@servicenow/sdk-build-plugins architecture" style={{ width: '100%', maxWidth: 680, borderRadius: 8, border: '1px solid var(--color-border)' }} />
      </Section>

      <Section title="Canonical Notes">
        <CodeBlock
          language="markdown"
          filename="portal/src/content/npm-knowledge/sdk-build-plugins.md"
          showLineNumbers={false}
          code={sdkBuildPlugins}
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
