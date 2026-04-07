import sdkApi from './npm-knowledge/sdk.md?raw'

export default function Ch12({ CodeBlock, Callout }) {
  return (
    <div className="space-y-8">
      <Section title="Overview">
        <p>
          Deep dive into <code>@servicenow/sdk-api</code>: Orchestrator lifecycle, Connector HTTP layer,
          dependency fetching, and install/pack/build flows.
        </p>
      </Section>

      <Section title="High-level Diagram">
        <img src="/diagrams/sdk-api.svg" alt="@servicenow/sdk-api architecture" style={{ width: '100%', maxWidth: 680, borderRadius: 8, border: '1px solid var(--color-border)' }} />
      </Section>

      <Section title="Canonical Notes">
        <CodeBlock
          language="markdown"
          filename="portal/src/content/npm-knowledge/sdk.md"
          showLineNumbers={false}
          code={sdkApi}
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
