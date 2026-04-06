export default function Ch06({ CodeBlock, Callout }) {
  return (
    <div className="space-y-8">
      <Callout type="warning" title="Community Package">
        <code>servicenow-glide</code> is a community-maintained package, not an official
        ServiceNow product. Use it for learning and exploration. Always verify compatibility
        before production use.
      </Callout>

      <Section title="Overview">
        <p>
          <code>servicenow-glide</code> is an npm package that provides a Node.js client for
          interacting with ServiceNow's Table API, Scripted REST APIs, and Attachment API.
          Unlike the official SDK (which runs <em>on</em> the platform), this library runs
          <em>off-platform</em> — useful for CLIs, integrations, and data pipelines.
        </p>
      </Section>

      <Section title="Integration architecture (off-platform)">
        <CodeBlock
          language="bash"
          filename="reference pipeline"
          showLineNumbers={false}
          code={`Source system (scanner/export/event)
  -> Node worker (servicenow-glide client)
  -> transform + validation layer
  -> ServiceNow Table/REST API calls
  -> audit logs + retry queue
  -> metrics and alerting`}
        />
        <p className="text-sm mt-2" style={{ color: 'var(--color-text-muted)' }}>
          Keep API-specific logic in a small client wrapper so table names, auth, and retry behavior
          are centralized instead of duplicated across scripts.
        </p>
      </Section>

      <Section title="Install and configure">
        <CodeBlock
          language="bash"
          filename="terminal"
          code={`cd projects/06-custom-glide-npm
npm install servicenow-glide`}
        />
        <CodeBlock
          language="js"
          filename="src/client.js"
          code={`import 'dotenv/config'
import ServiceNow from 'servicenow-glide'

// All credentials from environment variables — never hard-coded
const sn = new ServiceNow({
  instance: process.env.SN_INSTANCE_URL,
  auth: {
    username: process.env.SN_USERNAME,
    password: process.env.SN_PASSWORD,
  },
})

export default sn`}
        />
      </Section>

      <Section title="Retry and backoff for transient failures">
        <CodeBlock
          language="js"
          filename="src/lib/retry.js"
          code={`export async function withRetry(fn, attempts = 4) {
  let lastErr
  for (let i = 1; i <= attempts; i++) {
    try {
      return await fn()
    } catch (err) {
      lastErr = err
      const status = err?.response?.status
      const retryable = status === 429 || (status >= 500 && status <= 599)
      if (!retryable || i === attempts) break
      const backoffMs = Math.min(1000 * 2 ** (i - 1), 8000)
      await new Promise((r) => setTimeout(r, backoffMs))
    }
  }
  throw lastErr
}`}
        />
      </Section>

      <Section title="Large-table pagination strategy">
        <CodeBlock
          language="js"
          filename="src/examples/paginated-export.js"
          code={`import sn from './client.js'

let offset = 0
const pageSize = 200

while (true) {
  const { result } = await sn.table('incident')
    .query()
    .field(['sys_id', 'number', 'state'])
    .limit(pageSize)
    .offset(offset)
    .orderBy('sys_updated_on')
    .get()

  if (!result.length) break
  // process page...
  offset += result.length
}`}
        />
        <Callout type="tip">
          Paginate deterministically using a stable ordering field. This avoids duplicates or misses
          when records change during long-running exports.
        </Callout>
      </Section>

      <Section title="Operational safeguards">
        <ul className="list-disc list-inside space-y-1 text-sm" style={{ color: 'var(--color-text-muted)' }}>
          <li>Mask credentials and tokens in logs by default</li>
          <li>Add request IDs to every API call for traceability</li>
          <li>Track success/error counts and p95 latency per endpoint</li>
          <li>Use dry-run mode for migration scripts before mutating records</li>
        </ul>
      </Section>

      <Section title="Table API operations">
        <CodeBlock
          language="js"
          filename="src/examples/table-ops.js"
          code={`import sn from './client.js'

// Query records
const { result } = await sn.table('incident')
  .query()
  .field(['number', 'short_description', 'priority', 'state'])
  .limit(10)
  .orderByDesc('opened_at')
  .where('active', true)
  .get()

console.log(\`Found \${result.length} incidents\`)

// Create a record
const newRecord = await sn.table('incident')
  .create({
    short_description: 'Created via servicenow-glide',
    urgency: 2,
    category: 'software',
  })

console.log('Created:', newRecord.result.sys_id)

// Update a record by sys_id
await sn.table('incident')
  .update(newRecord.result.sys_id, {
    state: '6',
    close_notes: 'Resolved via API',
  })

// Delete
await sn.table('incident').delete(newRecord.result.sys_id)`}
        />
      </Section>

      <Section title="Attachment handling">
        <CodeBlock
          language="js"
          filename="src/examples/attachments.js"
          code={`import sn from './client.js'
import fs from 'node:fs'

// Upload an attachment to a record
const fileBuffer = fs.readFileSync('./scan-report.pdf')

await sn.attachment.upload({
  tableName: 'incident',
  tableSysId: 'abc123def456...',
  fileName: 'scan-report.pdf',
  contentType: 'application/pdf',
  data: fileBuffer,
})

// List attachments on a record
const attachments = await sn.attachment.list({
  tableName: 'incident',
  tableSysId: 'abc123def456...',
})

console.log(attachments.result.map(a => a.file_name))`}
        />
      </Section>

      <Section title="Official SDK vs servicenow-glide">
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                {['Feature', '@servicenow/sdk', 'servicenow-glide'].map(h => (
                  <th key={h} className="text-left py-2 pr-4 font-semibold" style={{ color: 'var(--color-text-primary)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                ['Runs on-platform', '✓', '✗ (off-platform only)'],
                ['Runs off-platform', '✗', '✓'],
                ['TypeScript types', '✓ via @servicenow/glide', '~partial'],
                ['Script Includes', '✓', '✗'],
                ['REST API deploy', '✓', '✗'],
                ['Table API client', 'N/A', '✓'],
                ['Attachment API', 'N/A', '✓'],
                ['Official support', '✓', 'Community'],
              ].map(([feat, sdk, glide]) => (
                <tr key={feat} style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <td className="py-2 pr-4" style={{ color: 'var(--color-text-muted)' }}>{feat}</td>
                  <td className="py-2 pr-4" style={{ color: sdk.startsWith('✓') ? 'var(--color-sn-green-light)' : 'var(--color-text-muted)' }}>{sdk}</td>
                  <td className="py-2" style={{ color: glide.startsWith('✓') ? 'var(--color-sn-green-light)' : 'var(--color-text-muted)' }}>{glide}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <Section title="Key Takeaways">
        <ul className="list-disc list-inside space-y-1 text-sm" style={{ color: 'var(--color-text-muted)' }}>
          <li><code>servicenow-glide</code> is ideal for off-platform scripts, migrations, and CLIs</li>
          <li>Credentials flow through environment variables — same pattern as all other chapters</li>
          <li>For platform development (Script Includes, REST APIs), use the official SDK</li>
          <li>Both can coexist in a monorepo — different layers of the same system</li>
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
