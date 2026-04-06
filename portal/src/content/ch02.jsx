export default function Ch02({ CodeBlock, Callout }) {
  return (
    <div className="space-y-8">
      <Section title="Overview">
        <p>
          <code>@servicenow/glide</code> ships TypeScript type declarations for every Glide
          Scriptable API on the platform. With these types you get full IntelliSense, refactoring
          support, and compile-time errors instead of runtime surprises on your PDI.
        </p>
        <p className="mt-2">
          In production, Glide code quality is mostly about query shape, mutation safety, and
          observability discipline. This chapter focuses on those concerns, not only API syntax.
        </p>
      </Section>

      <Section title="Install">
        <CodeBlock
          language="bash"
          filename="terminal"
          code={`cd projects/02-glide-api-basics

npm install @servicenow/sdk @servicenow/glide

# Also add TypeScript if you haven't already
npm install -D typescript
npx tsc --init`}
        />
        <CodeBlock
          language="js"
          filename="tsconfig.json (relevant excerpt)"
          code={`{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ES2020",
    "moduleResolution": "bundler",
    "strict": true,
    "types": ["@servicenow/glide"]
  }
}`}
        />
      </Section>

      <Section title="Safe mutation patterns">
        <CodeBlock
          language="js"
          filename="src/examples/mutation-safety.ts"
          code={`/// <reference types="@servicenow/glide" />

function closeIncidentSafely(sysId: string, note: string) {
  const gr = new GlideRecord('incident')
  if (!gr.get(sysId)) return { ok: false, code: 'NOT_FOUND' }

  const state = gr.getValue('state')
  if (state === '6' || state === '7') {
    return { ok: false, code: 'ALREADY_CLOSED' }
  }

  gr.setValue('state', '6')
  gr.setValue('close_notes', note)
  gr.setWorkflow(true)
  gr.autoSysFields(true)
  gr.update()

  gs.info(\`[IncidentOps] closed \${gr.getValue('number')} (\${sysId})\`)
  return { ok: true, sysId }
}`}
        />
      </Section>

      <Section title="Query planning before implementation">
        <CodeBlock
          language="bash"
          filename="design checklist"
          showLineNumbers={false}
          code={`1) Define exact record scope (table + filters)
2) Confirm indexed fields for primary predicates
3) Set deterministic ordering (orderBy/orderByDesc)
4) Apply upper bounds (setLimit)
5) Define minimal selected fields for response payloads`}
        />
        <Callout type="info">
          Most Glide performance incidents come from broad queries and missing limits, not from
          business logic complexity.
        </Callout>
      </Section>

      <Section title="GlideRecord — CRUD">
        <p>
          <code>GlideRecord</code> is the primary ORM for reading and writing platform tables.
        </p>
        <CodeBlock
          language="js"
          filename="src/examples/glide-record.ts"
          code={`/// <reference types="@servicenow/glide" />

// READ — query incidents opened in the last 7 days
function getRecentIncidents(): void {
  const gr = new GlideRecord('incident')
  gr.addEncodedQuery('opened_atONLast 7 days@javascript:gs.beginningOfLast7Days()@javascript:gs.endOfLast7Days()')
  gr.orderByDesc('opened_at')
  gr.setLimit(50)
  gr.query()

  while (gr.next()) {
    gs.log(\`[\${gr.number}] \${gr.short_description} — priority: \${gr.priority}\`)
  }
}

// CREATE — insert a record
function createIncident(shortDesc: string, urgency: number): string {
  const gr = new GlideRecord('incident')
  gr.initialize()
  gr.setValue('short_description', shortDesc)
  gr.setValue('urgency', urgency)
  gr.setValue('caller_id', gs.getUserID())
  const sysId = gr.insert()
  return sysId
}

// UPDATE — bulk update
function escalateCritical(): void {
  const gr = new GlideRecord('incident')
  gr.addQuery('priority', '1')
  gr.addQuery('state', 'IN', '1,2')
  gr.query()

  while (gr.next()) {
    gr.setValue('escalation', '3')
    gr.update()
  }
}

// DELETE (use sparingly — prefer state change)
function deleteTestRecord(sysId: string): boolean {
  const gr = new GlideRecord('incident')
  if (gr.get(sysId)) {
    return gr.deleteRecord()
  }
  return false
}`}
        />
      </Section>

      <Section title="GlideSystem (gs) Utilities">
        <CodeBlock
          language="js"
          filename="src/examples/gs-utilities.ts"
          code={`/// <reference types="@servicenow/glide" />

// Current user context
gs.getUserName()           // 'admin'
gs.getUserID()             // sys_id of current user
gs.hasRole('itil')         // boolean

// Logging
gs.log('message', 'source')
gs.info('info message')
gs.warn('warn message')
gs.error('error message')

// Date helpers
gs.nowDateTime()           // '2026-04-06 12:00:00'
gs.beginningOfToday()
gs.endOfToday()
gs.daysAgo(7)              // date 7 days ago

// Properties
const val = gs.getProperty('glide.ui.theme', 'default')
gs.setProperty('x_learn.feature_flag', 'true')

// Script execution context
gs.isInteractive()         // true if run from UI
gs.getSession().isLoggedIn()`}
        />
      </Section>

      <Section title="GlideAggregate — Aggregations">
        <CodeBlock
          language="js"
          filename="src/examples/aggregate.ts"
          code={`/// <reference types="@servicenow/glide" />

function getIncidentCountByPriority(): Record<string, number> {
  const ga = new GlideAggregate('incident')
  ga.addQuery('state', 'IN', '1,2,3')      // Open states
  ga.groupBy('priority')
  ga.addAggregate('COUNT')
  ga.query()

  const counts: Record<string, number> = {}
  while (ga.next()) {
    const priority = ga.getValue('priority')
    const count = parseInt(ga.getAggregate('COUNT'))
    counts[priority] = count
  }
  return counts
}`}
        />
      </Section>

      <Section title="Index-aware performance patterns">
        <ul className="list-disc list-inside space-y-1 text-sm" style={{ color: 'var(--color-text-muted)' }}>
          <li>Filter on indexed columns first (<code>state</code>, <code>priority</code>, date ranges)</li>
          <li>Prefer <code>GlideAggregate</code> for analytics over loop-based counting</li>
          <li>Use <code>setLimit()</code> for dashboard/list endpoints to cap query cost</li>
          <li>Avoid large write loops during peak business hours; batch where possible</li>
        </ul>
      </Section>

      <Section title="Diagnostics and troubleshooting">
        <CodeBlock
          language="bash"
          filename="common Glide issues"
          showLineNumbers={false}
          code={`Symptom: query is slow in production
  -> verify predicate fields are indexed and limits are applied

Symptom: updates succeed but business behavior is unexpected
  -> inspect Business Rules/Flows triggered by update()

Symptom: aggregation mismatch with reports
  -> align state filters and null-handling rules

Symptom: intermittent script failures
  -> add structured gs.error/gs.warn logs with correlation IDs`}
        />
      </Section>

      <Callout type="tip" title="TypeScript tip">
        Add <code>/// &lt;reference types="@servicenow/glide" /&gt;</code> at the top of any
        server-side TypeScript file to activate Glide type checking. No import needed — it's
        ambient.
      </Callout>

      <Section title="Key Takeaways">
        <ul className="list-disc list-inside space-y-1 text-sm" style={{ color: 'var(--color-text-muted)' }}>
          <li><code>@servicenow/glide</code> provides ambient TypeScript types for all Glide APIs</li>
          <li><code>GlideRecord</code> handles CRUD with a fluent query builder</li>
          <li><code>GlideAggregate</code> is purpose-built for COUNT / SUM / AVG queries</li>
          <li><code>gs</code> is the global utility object — logging, user context, dates, properties</li>
          <li>Production-grade Glide code requires explicit limits, index-aware filters, and safe mutation guards</li>
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
