export default function Ch04({ CodeBlock, Callout }) {
  return (
    <div className="space-y-8">
      <Section title="Overview">
        <p>
          Scripted REST APIs let you expose custom HTTP endpoints on your ServiceNow instance.
          With the Fluent SDK, the entire API definition — resource paths, HTTP methods, headers,
          and handler logic — lives as versioned code.
        </p>
      </Section>

      <Section title="Define an API">
        <CodeBlock
          language="js"
          filename="src/x_learn_rest/IncidentAPI.ts"
          code={`/// <reference types="@servicenow/glide" />
import { restAPI, resource, GET, POST } from '@servicenow/sdk/rest'

/**
 * Scripted REST API: Incident Service
 * Base path: /api/x_learn_rest/incidents
 */
export default restAPI({
  name: 'IncidentService',
  basePath: '/incidents',
  version: 'v1',

  resources: [
    resource({
      relativePath: '/',
      methods: [
        GET(function handler() {
          const request = this.request
          const response = this.response

          const limit = parseInt(request.queryParams.limit?.[0] ?? '25')
          const state  = request.queryParams.state?.[0] ?? 'open'

          const gr = new GlideRecord('incident')
          if (state === 'open') gr.addQuery('active', true)
          gr.setLimit(Math.min(limit, 100))
          gr.orderByDesc('opened_at')
          gr.query()

          const incidents: object[] = []
          while (gr.next()) {
            incidents.push({
              sys_id:            gr.getUniqueValue(),
              number:            gr.getValue('number'),
              short_description: gr.getValue('short_description'),
              priority:          gr.getValue('priority'),
              state:             gr.getValue('state'),
              opened_at:         gr.getValue('opened_at'),
            })
          }

          response.setStatus(200)
          response.setBody({ result: incidents, count: incidents.length })
        }),

        POST(function handler() {
          const body = this.request.body.dataString
          const payload = JSON.parse(body)

          const gr = new GlideRecord('incident')
          gr.initialize()
          gr.setValue('short_description', payload.short_description)
          gr.setValue('urgency', payload.urgency ?? 3)
          gr.setValue('category', payload.category ?? 'software')
          const sysId = gr.insert()

          this.response.setStatus(201)
          this.response.setBody({ result: { sys_id: sysId } })
        }),
      ],
    }),

    resource({
      relativePath: '/{sys_id}',
      methods: [
        GET(function handler() {
          const sysId = this.pathParams.sys_id
          const gr = new GlideRecord('incident')

          if (!gr.get(sysId)) {
            this.response.setStatus(404)
            this.response.setBody({ error: 'Not found' })
            return
          }

          this.response.setStatus(200)
          this.response.setBody({
            result: {
              sys_id:            gr.getUniqueValue(),
              number:            gr.getValue('number'),
              short_description: gr.getValue('short_description'),
              priority:          gr.getValue('priority'),
            },
          })
        }),
      ],
    }),
  ],
})`}
        />
      </Section>

      <Section title="Test with curl">
        <Callout type="danger" title="🔒 Never expose credentials in test commands">
          Use environment variables when calling your PDI from the command line.
        </Callout>
        <CodeBlock
          language="bash"
          filename="terminal"
          code={`# Load credentials from .env (never paste them inline)
export $(grep -v '^#' .env | xargs)

# GET — list open incidents
curl -s -u "$SN_USERNAME:$SN_PASSWORD" \\
  "$SN_INSTANCE_URL/api/x_learn_rest/incidents/v1/?limit=5" | jq .

# POST — create an incident
curl -s -X POST \\
  -u "$SN_USERNAME:$SN_PASSWORD" \\
  -H "Content-Type: application/json" \\
  -d '{"short_description":"Test from Fluent API","urgency":2}' \\
  "$SN_INSTANCE_URL/api/x_learn_rest/incidents/v1/" | jq .`}
        />
      </Section>

      <Section title="Error handling pattern">
        <CodeBlock
          language="js"
          filename="src/x_learn_rest/helpers/respond.ts"
          code={`/// <reference types="@servicenow/glide" />

export function ok(response: GlideScopedEvaluator, body: object) {
  response.setStatus(200)
  response.setBody({ result: body })
}

export function created(response: GlideScopedEvaluator, body: object) {
  response.setStatus(201)
  response.setBody({ result: body })
}

export function notFound(response: GlideScopedEvaluator, message = 'Not found') {
  response.setStatus(404)
  response.setBody({ error: { message, status: 404 } })
}

export function badRequest(response: GlideScopedEvaluator, message: string) {
  response.setStatus(400)
  response.setBody({ error: { message, status: 400 } })
}`}
        />
      </Section>

      <Section title="Key Takeaways">
        <ul className="list-disc list-inside space-y-1 text-sm" style={{ color: 'var(--color-text-muted)' }}>
          <li>REST API definitions are JavaScript objects — fully version-controlled</li>
          <li>Path and query parameters are type-safe via SDK helper types</li>
          <li>Always validate request body before inserting or updating records</li>
          <li>Use env variables for all credentials when calling the API from CLI tools</li>
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
