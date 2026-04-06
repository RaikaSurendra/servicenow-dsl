export default function Ch03({ CodeBlock, Callout }) {
  return (
    <div className="space-y-8">
      <Section title="Overview">
        <p>
          Traditional ServiceNow Script Includes are isolated blobs of code managed in the
          platform UI. The Fluent SDK lets you write them as native <strong>ES modules</strong> —
          with imports, exports, TypeScript, and unit tests — then deploy them as Script Includes
          automatically.
        </p>
      </Section>

      <Section title="Module anatomy">
        <CodeBlock
          language="js"
          filename="src/x_learn_modules/IncidentUtils.ts"
          code={`/// <reference types="@servicenow/glide" />

/**
 * IncidentUtils — reusable server-side incident helpers
 * Deployed as Script Include: x_learn_modules.IncidentUtils
 */

export function getIncidentsByCategory(category: string, limit = 25): GlideRecord {
  const gr = new GlideRecord('incident')
  gr.addQuery('category', category)
  gr.addQuery('active', true)
  gr.orderByDesc('opened_at')
  gr.setLimit(limit)
  gr.query()
  return gr
}

export function resolveIncident(sysId: string, resolutionNote: string): boolean {
  const gr = new GlideRecord('incident')
  if (!gr.get(sysId)) return false

  gr.setValue('state', '6')                    // Resolved
  gr.setValue('close_code', 'Solved (Permanently)')
  gr.setValue('close_notes', resolutionNote)
  gr.setValue('resolved_at', gs.nowDateTime())
  gr.setValue('resolved_by', gs.getUserID())
  gr.update()
  return true
}

export function calculateSLAStatus(gr: GlideRecord): 'on-track' | 'at-risk' | 'breached' {
  const dueDate = gr.getValue('sla_due')
  if (!dueDate) return 'on-track'

  const now = new GlideDateTime()
  const due = new GlideDateTime(dueDate)
  const diffMinutes = GlideDateTime.subtract(now, due).getNumericValue() / 60000

  if (diffMinutes > 0)   return 'breached'
  if (diffMinutes > -60) return 'at-risk'
  return 'on-track'
}`}
        />
      </Section>

      <Section title="Designing module boundaries for maintainability">
        <CodeBlock
          language="bash"
          filename="recommended module layering"
          showLineNumbers={false}
          code={`src/x_learn_modules/
├── domain/
│   ├── IncidentUtils.ts       # business rules and calculations
│   └── SlaPolicy.ts
├── data/
│   └── IncidentRepository.ts  # GlideRecord access only
├── integration/
│   └── EventPublisher.ts      # events/notifications
└── entrypoints/
    ├── BusinessRule_OnInsert.ts
    └── ScriptInclude_API.ts`}
        />
        <p className="text-sm mt-3" style={{ color: 'var(--color-text-muted)' }}>
          Keep <code>GlideRecord</code> operations inside repository-style modules where possible.
          This makes logic easier to test and avoids copy/paste query drift across Business Rules,
          Script Includes, and REST handlers.
        </p>
      </Section>

      <Section title="Consuming modules on the server">
        <CodeBlock
          language="js"
          filename="src/x_learn_modules/BusinessRule_OnIncidentInsert.ts"
          code={`/// <reference types="@servicenow/glide" />
import { calculateSLAStatus } from './IncidentUtils'

// This code runs as a Business Rule after insert on 'incident'
const status = calculateSLAStatus(current)
gs.info(\`New incident \${current.number} SLA status: \${status}\`)`}
        />
        <Callout type="info">
          The Fluent SDK resolves imports at build time and bundles them into the deployed Script
          Include. There is no runtime <code>require()</code> on the platform.
        </Callout>
      </Section>

      <Section title="Unit testing modules">
        <CodeBlock
          language="bash"
          filename="terminal"
          code={`# Install test runner
npm install -D jest @types/jest ts-jest

# Run tests (no PDI needed — pure unit tests)
npx jest`}
        />
        <CodeBlock
          language="js"
          filename="src/x_learn_modules/__tests__/IncidentUtils.test.ts"
          code={`import { calculateSLAStatus } from '../IncidentUtils'

// Mock GlideRecord and GlideDateTime for unit tests
jest.mock('@servicenow/glide', () => ({
  GlideDateTime: class {
    constructor(public val = '') {}
    static subtract(a: any, b: any) { return { getNumericValue: () => -120 * 60000 } }
  },
}), { virtual: true })

describe('calculateSLAStatus', () => {
  it('returns on-track when due is more than 60 min away', () => {
    const mockGr = { getValue: () => '2099-01-01 00:00:00' } as any
    expect(calculateSLAStatus(mockGr)).toBe('on-track')
  })
})`}
        />
      </Section>

      <Section title="Error handling and observability contract">
        <CodeBlock
          language="js"
          filename="src/x_learn_modules/IncidentService.ts"
          code={`/// <reference types="@servicenow/glide" />

type ResolveResult =
  | { ok: true; sysId: string }
  | { ok: false; code: 'NOT_FOUND' | 'INVALID_STATE'; message: string }

export function resolveIncidentSafe(sysId: string, resolutionNote: string): ResolveResult {
  try {
    const gr = new GlideRecord('incident')
    if (!gr.get(sysId)) {
      gs.warn(\`[IncidentService] resolve failed; sys_id not found: \${sysId}\`)
      return { ok: false, code: 'NOT_FOUND', message: 'Incident not found' }
    }

    if (gr.getValue('state') === '6') {
      return { ok: false, code: 'INVALID_STATE', message: 'Incident already resolved' }
    }

    gr.setValue('state', '6')
    gr.setValue('close_notes', resolutionNote)
    gr.update()

    gs.info(\`[IncidentService] resolved \${gr.getValue('number')} (\${sysId})\`)
    return { ok: true, sysId }
  } catch (e) {
    gs.error(\`[IncidentService] unexpected resolve error: \${e.message}\`)
    throw e
  }
}`}
        />
        <Callout type="tip">
          Return structured error objects for expected failures and reserve thrown exceptions for
          unexpected conditions. This keeps upstream handlers deterministic.
        </Callout>
      </Section>

      <Section title="Performance patterns for Glide-heavy modules">
        <ul className="list-disc list-inside space-y-1 text-sm" style={{ color: 'var(--color-text-muted)' }}>
          <li>Prefer encoded queries + indexed columns over broad table scans</li>
          <li>Set explicit limits on list operations to cap worst-case runtime</li>
          <li>Avoid calling <code>update()</code> in large loops without batching strategy</li>
          <li>Use <code>GlideAggregate</code> for counts and grouped analytics instead of in-memory loops</li>
        </ul>
      </Section>

      <Section title="Build and deploy">
        <CodeBlock
          language="bash"
          filename="terminal"
          code={`# Build compiles TS → JS and resolves module graph
snc app build

# Deploy — Script Includes appear in ServiceNow under
# System Definition > Script Includes
snc app install`}
        />
      </Section>

      <Section title="Deployment verification checklist">
        <CodeBlock
          language="bash"
          filename="post-deploy checks"
          showLineNumbers={false}
          code={`1) Open System Definition > Script Includes
2) Confirm generated records exist in expected scope
3) Execute entrypoint script in a safe test context
4) Validate logs include expected [ModuleName] prefixes
5) Run unit tests again before next deploy batch`}
        />
      </Section>

      <Section title="Key Takeaways">
        <ul className="list-disc list-inside space-y-1 text-sm" style={{ color: 'var(--color-text-muted)' }}>
          <li>ES module imports work across server-side files — SDK bundles them at build time</li>
          <li>TypeScript types from <code>@servicenow/glide</code> cover all Glide APIs</li>
          <li>Unit test server-side logic without a running PDI using Jest + mocks</li>
          <li>Deployed Script Includes respect your app scope prefix automatically</li>
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
