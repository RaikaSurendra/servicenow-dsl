export default function Ch05({ CodeBlock, Callout }) {
  return (
    <div className="space-y-8">
      <Section title="Overview">
        <p>
          The <strong>Now Experience UI Framework</strong> lets you build React components that run
          natively inside ServiceNow's UI Builder and portal pages. Components use the
          Now Design System for consistent styling and connect to backend APIs via ServiceNow's
          client-side data layer.
        </p>
      </Section>

      <Section title="Project scaffold">
        <CodeBlock
          language="bash"
          filename="terminal"
          code={`# Inside your Fluent app project
snc ui-component create --name x-learn-incident-card

# Generated structure:
# src/
#   x-learn-incident-card/
#     index.js          ← component entry
#     styles.scss       ← scoped styles
#     __tests__/
#       component.test.js`}
        />
      </Section>

      <Section title="A Now Experience component">
        <CodeBlock
          language="js"
          filename="src/x-learn-incident-card/index.js"
          code={`import { createCustomElement } from '@servicenow/ui-core'
import snabbdom from '@servicenow/ui-renderer-snabbdom'
import styles from './styles.scss'

// Component state shape
const initialState = {
  loading: false,
  incident: null,
  error: null,
}

// Action handlers
const actionHandlers = {
  COMPONENT_CONNECTED: ({ action, dispatch, updateState }) => {
    const { sysId } = action.payload.properties
    if (!sysId) return

    updateState({ loading: true })
    dispatch('FETCH_INCIDENT', { sysId })
  },

  FETCH_INCIDENT: {
    effect({ action, dispatch }) {
      const { sysId } = action.payload
      // ServiceNow's client-side fetch utility
      fetch(\`/api/now/table/incident/\${sysId}?sysparm_fields=number,short_description,priority,state\`)
        .then((r) => r.json())
        .then(({ result }) => dispatch('FETCH_INCIDENT_SUCCESS', { incident: result }))
        .catch((err) => dispatch('FETCH_INCIDENT_ERROR', { error: err.message }))
    },
  },

  FETCH_INCIDENT_SUCCESS: ({ action, updateState }) => {
    updateState({ loading: false, incident: action.payload.incident })
  },

  FETCH_INCIDENT_ERROR: ({ action, updateState }) => {
    updateState({ loading: false, error: action.payload.error })
  },
}

// View (Snabbdom virtual DOM)
const view = (state, dispatch) => {
  const { loading, incident, error } = state

  if (loading) return <now-loader />
  if (error)   return <now-alert status="critical">{error}</now-alert>
  if (!incident) return <now-alert status="info">No incident selected</now-alert>

  const priorityMap = { '1': 'critical', '2': 'high', '3': 'moderate', '4': 'low' }

  return (
    <div className="incident-card">
      <now-card>
        <now-card-header slot="header">
          <now-icon icon="incident-outline" size="sm" />
          <span className="now-font-label-md">{incident.number}</span>
          <now-tag
            slot="actions"
            label={priorityMap[incident.priority] || 'unknown'}
            status={priorityMap[incident.priority] === 'critical' ? 'critical' : 'warning'}
          />
        </now-card-header>
        <now-card-content>
          <p className="now-font-body-md">{incident.short_description}</p>
        </now-card-content>
      </now-card>
    </div>
  )
}

createCustomElement('x-learn-incident-card', {
  renderer: { type: snabbdom },
  initialState,
  actionHandlers,
  view,
  styles,
  properties: {
    sysId: { default: '' },
  },
})`}
        />
      </Section>

      <Section title="Deploy and use in UI Builder">
        <CodeBlock
          language="bash"
          filename="terminal"
          code={`# Build component
snc ui-component build

# Deploy to PDI
snc ui-component deploy --component x-learn-incident-card

# Your component is now available in UI Builder
# → Experience → UI Builder → Add component → x-learn-incident-card`}
        />
        <Callout type="info">
          Components deployed via the SDK are scoped to your app's scope prefix. They appear in
          UI Builder's component picker automatically after deploy.
        </Callout>
      </Section>

      <Section title="Local development server">
        <CodeBlock
          language="bash"
          filename="terminal"
          code={`# Start local dev server with hot-reload
snc ui-component develop --open

# This proxies API calls to your PDI (reads SN_INSTANCE_URL from .env)
# Visit http://localhost:8081 to see your component in isolation`}
        />
      </Section>

      <Section title="Key Takeaways">
        <ul className="list-disc list-inside space-y-1 text-sm" style={{ color: 'var(--color-text-muted)' }}>
          <li>Now Experience components use Snabbdom (virtual DOM) not React directly</li>
          <li>State management follows an action/dispatch pattern similar to Redux</li>
          <li>Components talk to the platform via standard <code>fetch()</code> to REST APIs</li>
          <li>Local dev server proxies to your PDI — keep credentials in <code>.env</code></li>
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
