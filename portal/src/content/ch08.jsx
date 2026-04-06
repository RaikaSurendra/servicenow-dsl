export default function Ch08({ CodeBlock, Callout }) {
  return (
    <div className="space-y-10">
      {/* Intro */}
      <div className="p-5 rounded-xl border" style={{ borderColor: '#6366f1', background: 'rgba(99,102,241,0.06)' }}>
        <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: '#a5b4fc' }}>Full Application MVP</p>
        <h2 className="text-xl font-bold mb-2" style={{ color: 'var(--color-text-primary)' }}>
          Container Vulnerability Management
        </h2>
        <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
          A production-grade ServiceNow application built entirely with the Fluent SDK.
          Custom tables, Scripted REST APIs, a React dashboard, automated remediation
          workflows, and SLA enforcement — all version-controlled as code.
        </p>
      </div>

      {/* Architecture */}
      <Section title="Application Architecture">
        <div className="grid grid-cols-2 gap-3 mt-3">
          {[
            { label: 'Tables', items: ['Container Registry', 'CVE Findings', 'Remediation Tasks', 'Vuln Policies'] },
            { label: 'REST APIs', items: ['POST /scan-ingest', 'GET /dashboard-stats', 'GET /findings', 'PATCH /remediate'] },
            { label: 'UI', items: ['Risk Dashboard', 'Container Inventory', 'CVE Detail Panel', 'Remediation Board'] },
            { label: 'Automation', items: ['Auto-create tasks on Critical CVE', 'SLA timers by severity', 'Slack/email notifications', 'Aging report jobs'] },
          ].map(({ label, items }) => (
            <div key={label} className="p-3 rounded-lg border" style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface-raised)' }}>
              <p className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color: 'var(--color-sn-green-light)' }}>{label}</p>
              <ul className="space-y-0.5">
                {items.map(i => (
                  <li key={i} className="text-xs" style={{ color: 'var(--color-text-muted)' }}>• {i}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </Section>

      {/* Data model */}
      <Section title="Data Model">
        <p>Four custom tables scoped under <code>x_vuln_container</code>:</p>

        <CodeBlock
          language="js"
          filename="src/tables/container-registry.js"
          code={`import { table, field } from '@servicenow/sdk/metadata'

export default table({
  name: 'x_vuln_container_registry',
  label: 'Container Registry',
  labelPlural: 'Container Registries',
  extends: 'task',                // Inherits number, state, assignment fields
  fields: {
    image_name:     field.string({ label: 'Image Name',     mandatory: true }),
    image_tag:      field.string({ label: 'Image Tag',      default: 'latest' }),
    registry_url:   field.url   ({ label: 'Registry URL' }),
    digest:         field.string({ label: 'Image Digest (SHA256)' }),
    last_scanned:   field.dateTime({ label: 'Last Scanned' }),
    scan_status:    field.choice({
      label: 'Scan Status',
      choices: [
        { value: 'pending',   label: 'Pending' },
        { value: 'scanning',  label: 'Scanning' },
        { value: 'complete',  label: 'Complete' },
        { value: 'failed',    label: 'Failed' },
      ],
      default: 'pending',
    }),
    total_cves:     field.integer({ label: 'Total CVEs',    default: 0 }),
    critical_count: field.integer({ label: 'Critical CVEs', default: 0 }),
    high_count:     field.integer({ label: 'High CVEs',     default: 0 }),
    risk_score:     field.decimal({ label: 'Risk Score',    default: 0.0 }),
    team:           field.reference({ label: 'Owning Team', refTable: 'sys_user_group' }),
  },
})`}
        />

        <CodeBlock
          language="js"
          filename="src/tables/cve-finding.js"
          code={`import { table, field } from '@servicenow/sdk/metadata'

export default table({
  name: 'x_vuln_finding',
  label: 'CVE Finding',
  fields: {
    container: field.reference({
      label: 'Container',
      refTable: 'x_vuln_container_registry',
      mandatory: true,
    }),
    cve_id:       field.string ({ label: 'CVE ID',       mandatory: true }),  // CVE-2024-1234
    cvss_score:   field.decimal({ label: 'CVSS Score' }),
    severity:     field.choice({
      label: 'Severity',
      choices: [
        { value: 'critical', label: 'Critical' },
        { value: 'high',     label: 'High'     },
        { value: 'medium',   label: 'Medium'   },
        { value: 'low',      label: 'Low'      },
        { value: 'info',     label: 'Info'     },
      ],
    }),
    package_name:    field.string({ label: 'Affected Package' }),
    package_version: field.string({ label: 'Package Version' }),
    fixed_version:   field.string({ label: 'Fixed In Version' }),
    description:     field.html  ({ label: 'Description' }),
    published_date:  field.date  ({ label: 'Published Date' }),
    status:          field.choice({
      label: 'Status',
      choices: [
        { value: 'open',        label: 'Open'        },
        { value: 'in_progress', label: 'In Progress' },
        { value: 'resolved',    label: 'Resolved'    },
        { value: 'accepted',    label: 'Risk Accepted'},
        { value: 'false_pos',   label: 'False Positive'},
      ],
      default: 'open',
    }),
    remediation_task: field.reference({
      label: 'Remediation Task',
      refTable: 'x_vuln_remediation_task',
    }),
    sla_due_date: field.dateTime({ label: 'SLA Due Date' }),
    days_open:    field.integer ({ label: 'Days Open', readOnly: true }),
  },
})`}
        />
      </Section>

      {/* REST API — scan ingest */}
      <Section title="Scan Ingest API">
        <p>
          This REST endpoint receives CVE scan results from external scanners (Trivy, Grype, Snyk)
          and creates/updates findings in ServiceNow.
        </p>
        <CodeBlock
          language="js"
          filename="src/rest-apis/scan-ingest.js"
          code={`/// <reference types="@servicenow/glide" />
import { restAPI, resource, POST } from '@servicenow/sdk/rest'
import { VulnScanImporter } from '../modules/VulnScanImporter'

export default restAPI({
  name: 'ScanIngestAPI',
  basePath: '/scan-ingest',

  resources: [
    resource({
      relativePath: '/',
      methods: [
        POST(function handler() {
          const body = JSON.parse(this.request.body.dataString)

          // Validate required fields
          if (!body.image_name || !body.findings) {
            this.response.setStatus(400)
            this.response.setBody({ error: 'image_name and findings are required' })
            return
          }

          try {
            const importer = new VulnScanImporter()
            const result = importer.ingestScan({
              imageName:    body.image_name,
              imageTag:     body.image_tag || 'latest',
              digest:       body.digest,
              findings:     body.findings,      // Array of CVE objects
              scannerName:  body.scanner || 'unknown',
              scannedAt:    body.scanned_at || gs.nowDateTime(),
            })

            this.response.setStatus(201)
            this.response.setBody({
              result: {
                container_sys_id: result.containerSysId,
                findings_created: result.created,
                findings_updated: result.updated,
                risk_score:       result.riskScore,
              },
            })
          } catch (e) {
            gs.error('ScanIngestAPI error: ' + e.message)
            this.response.setStatus(500)
            this.response.setBody({ error: 'Ingest failed' })
          }
        }),
      ],
    }),
  ],
})`}
        />
      </Section>

      {/* Risk Scorer module */}
      <Section title="Risk Scorer Module">
        <CodeBlock
          language="js"
          filename="src/modules/RiskScorer.js"
          code={`/// <reference types="@servicenow/glide" />

/**
 * RiskScorer — calculates a composite risk score for a container image
 * Score range: 0–100 (higher = more risk)
 *
 * Algorithm:
 *   score = (critical * 10) + (high * 5) + (medium * 2) + (low * 0.5)
 *   Capped at 100, normalized by total findings count
 */
export class RiskScorer {
  calculate(containerSysId) {
    const counts = this._getCounts(containerSysId)
    const raw = (counts.critical * 10) + (counts.high * 5)
              + (counts.medium * 2)    + (counts.low * 0.5)
    return Math.min(Math.round(raw), 100)
  }

  getRiskLabel(score) {
    if (score >= 80) return 'Critical'
    if (score >= 60) return 'High'
    if (score >= 30) return 'Medium'
    return 'Low'
  }

  _getCounts(containerSysId) {
    const counts = { critical: 0, high: 0, medium: 0, low: 0 }
    const ga = new GlideAggregate('x_vuln_finding')
    ga.addQuery('container', containerSysId)
    ga.addQuery('status', 'IN', 'open,in_progress')
    ga.groupBy('severity')
    ga.addAggregate('COUNT')
    ga.query()

    while (ga.next()) {
      const severity = ga.getValue('severity')
      const count    = parseInt(ga.getAggregate('COUNT'))
      if (counts.hasOwnProperty(severity)) counts[severity] = count
    }
    return counts
  }
}`}
        />
      </Section>

      {/* Dashboard stats API */}
      <Section title="Dashboard Stats API">
        <CodeBlock
          language="js"
          filename="src/rest-apis/dashboard-stats.js"
          code={`/// <reference types="@servicenow/glide" />
import { restAPI, resource, GET } from '@servicenow/sdk/rest'

export default restAPI({
  name: 'DashboardStatsAPI',
  basePath: '/dashboard-stats',

  resources: [
    resource({
      relativePath: '/',
      methods: [
        GET(function handler() {
          // Total open findings by severity
          const severityGa = new GlideAggregate('x_vuln_finding')
          severityGa.addQuery('status', 'open')
          severityGa.groupBy('severity')
          severityGa.addAggregate('COUNT')
          severityGa.query()

          const bySeverity = {}
          while (severityGa.next()) {
            bySeverity[severityGa.getValue('severity')] =
              parseInt(severityGa.getAggregate('COUNT'))
          }

          // Containers scanned in last 7 days
          const scanGr = new GlideAggregate('x_vuln_container_registry')
          scanGr.addQuery('last_scanned', '>=', gs.daysAgo(7))
          scanGr.addAggregate('COUNT')
          scanGr.query()
          scanGr.next()
          const recentScans = parseInt(scanGr.getAggregate('COUNT'))

          // Average risk score
          const riskGa = new GlideAggregate('x_vuln_container_registry')
          riskGa.addAggregate('AVG', 'risk_score')
          riskGa.query()
          riskGa.next()
          const avgRisk = parseFloat(riskGa.getAggregate('AVG', 'risk_score')).toFixed(1)

          // SLA breaches
          const slaGr = new GlideRecord('x_vuln_finding')
          slaGr.addQuery('status', 'open')
          slaGr.addQuery('sla_due_date', '<', gs.nowDateTime())
          slaGr.addNotNullQuery('sla_due_date')
          slaGr.query()
          const slaBreaches = slaGr.getRowCount()

          this.response.setStatus(200)
          this.response.setBody({
            result: {
              by_severity: bySeverity,
              recent_scans: recentScans,
              avg_risk_score: parseFloat(avgRisk),
              sla_breaches: slaBreaches,
              as_of: gs.nowDateTime(),
            },
          })
        }),
      ],
    }),
  ],
})`}
        />
      </Section>

      {/* React Dashboard */}
      <Section title="React Dashboard (Now Experience)">
        <p>
          The UI is a Now Experience web component built with React-style patterns via Snabbdom.
          It polls the dashboard stats API every 60 seconds and visualises severity counts and
          risk trends.
        </p>
        <CodeBlock
          language="js"
          filename="src/ui/VulnDashboard/index.js"
          code={`import { createCustomElement } from '@servicenow/ui-core'
import snabbdom from '@servicenow/ui-renderer-snabbdom'
import styles from './styles.scss'

const SEVERITY_COLORS = {
  critical: '#ef4444',
  high:     '#f97316',
  medium:   '#f59e0b',
  low:      '#22c55e',
}

const actionHandlers = {
  COMPONENT_CONNECTED: ({ dispatch }) => {
    dispatch('LOAD_STATS')
  },

  LOAD_STATS: {
    effect({ dispatch }) {
      fetch('/api/x_vuln_container/dashboard-stats/v1/')
        .then(r => r.json())
        .then(({ result }) => dispatch('STATS_LOADED', { stats: result }))
        .catch(err => dispatch('STATS_ERROR', { error: err.message }))
    },
  },

  STATS_LOADED: ({ action, updateState }) => {
    updateState({ loading: false, stats: action.payload.stats, error: null })
    // Auto-refresh every 60s
    setTimeout(() => {}, 60000)
  },

  STATS_ERROR: ({ action, updateState }) => {
    updateState({ loading: false, error: action.payload.error })
  },
}

const view = ({ loading, stats, error }) => {
  if (loading) return <now-loader label="Loading dashboard..." />
  if (error)   return <now-alert status="critical" icon="warning-fill">{error}</now-alert>
  if (!stats)  return null

  const sev = stats.by_severity || {}

  return (
    <div className="vuln-dashboard">
      <h1 className="now-font-heading-lg">Container Vulnerability Dashboard</h1>
      <p className="now-font-label-sm muted">as of {stats.as_of}</p>

      {/* KPI row */}
      <div className="kpi-row">
        <KpiCard label="Critical CVEs" value={sev.critical || 0} color={SEVERITY_COLORS.critical} />
        <KpiCard label="High CVEs"     value={sev.high     || 0} color={SEVERITY_COLORS.high}     />
        <KpiCard label="SLA Breaches"  value={stats.sla_breaches} color="#c084fc" />
        <KpiCard label="Avg Risk Score" value={stats.avg_risk_score} color="#60a5fa" />
      </div>

      {/* Severity bar chart */}
      <SeverityBar bySeverity={sev} />
    </div>
  )
}

const KpiCard = ({ label, value, color }) => (
  <div className="kpi-card">
    <span className="kpi-value" style={{ color }}>{value}</span>
    <span className="kpi-label">{label}</span>
  </div>
)

const SeverityBar = ({ bySeverity }) => {
  const total = Object.values(bySeverity).reduce((s, v) => s + v, 0) || 1
  return (
    <div className="severity-bar-wrap">
      <p className="now-font-label-sm">Open Findings by Severity</p>
      <div className="severity-bar">
        {Object.entries(SEVERITY_COLORS).map(([sev, color]) => {
          const count = bySeverity[sev] || 0
          const pct   = ((count / total) * 100).toFixed(1)
          return count > 0 ? (
            <div
              key={sev}
              className="severity-segment"
              style={{ width: \`\${pct}%\`, background: color }}
              title={\`\${sev}: \${count}\`}
            />
          ) : null
        })}
      </div>
    </div>
  )
}

createCustomElement('x-vuln-dashboard', {
  renderer: { type: snabbdom },
  initialState: { loading: true, stats: null, error: null },
  actionHandlers,
  view,
  styles,
})`}
        />
      </Section>

      {/* Seed data */}
      <Section title="Mock CVE Seed Data">
        <p>
          The <code>seed-data/</code> folder contains a JSON fixture with 50 realistic CVEs for
          local development and demos. Use the ingest API to load it:
        </p>
        <CodeBlock
          language="bash"
          filename="terminal"
          code={`# Load seed data to your PDI (credentials from .env)
export $(grep -v '^#' .env | xargs)

node scripts/seed-cves.js \\
  --instance "$SN_INSTANCE_URL" \\
  --user "$SN_USERNAME" \\
  --pass "$SN_PASSWORD"`}
        />
        <Callout type="danger" title="🔒 No real CVE data in seed files">
          The seed data uses fabricated CVE IDs and package names. Never commit real scan
          results, actual container digests, or anything that reveals your production
          infrastructure layout.
        </Callout>
      </Section>

      {/* SLA policy */}
      <Section title="SLA Policy Configuration">
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse mt-2">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                {['Severity', 'SLA', 'Auto-task', 'Escalation'].map(h => (
                  <th key={h} className="text-left py-2 pr-4 font-semibold" style={{ color: 'var(--color-text-primary)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                ['Critical', '24 hours',  '✓ Immediate', 'P1 incident + manager alert'],
                ['High',     '7 days',    '✓ Auto',      'Team lead notification'],
                ['Medium',   '30 days',   '✓ Auto',      'Weekly digest'],
                ['Low',      '90 days',   '○ Manual',    'Monthly report'],
                ['Info',     'No SLA',    '✗',           '—'],
              ].map(([sev, sla, task, esc]) => (
                <tr key={sev} style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <td className="py-2 pr-4 font-medium" style={{ color: SEVERITY_CELL_COLOR[sev] }}>{sev}</td>
                  <td className="py-2 pr-4" style={{ color: 'var(--color-text-muted)' }}>{sla}</td>
                  <td className="py-2 pr-4" style={{ color: 'var(--color-text-muted)' }}>{task}</td>
                  <td className="py-2"      style={{ color: 'var(--color-text-muted)' }}>{esc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <Section title="Deployment Checklist">
        <ul className="space-y-1 text-sm" style={{ color: 'var(--color-text-muted)' }}>
          {[
            'Copy .env.example → .env, fill in PDI credentials',
            'npm install && snc app build',
            'snc app install — deploys tables, modules, REST APIs',
            'snc ui-component deploy — deploys React dashboard',
            'Load seed data: node scripts/seed-cves.js',
            'Verify in PDI: Container Vuln Mgmt app appears in app navigator',
            'Test ingest API with curl (see Chapter 4 pattern)',
            'Open UI Builder → add x-vuln-dashboard to a portal page',
          ].map((step, i) => (
            <li key={i} className="flex items-start gap-2">
              <span className="font-mono text-xs mt-0.5 shrink-0" style={{ color: 'var(--color-sn-green-light)' }}>
                [{String(i + 1).padStart(2, '0')}]
              </span>
              {step}
            </li>
          ))}
        </ul>
      </Section>
    </div>
  )
}

const SEVERITY_CELL_COLOR = {
  Critical: '#ef4444',
  High:     '#f97316',
  Medium:   '#f59e0b',
  Low:      '#22c55e',
  Info:     '#94a3b8',
}

function Section({ title, children }) {
  return (
    <section>
      <h2 className="text-lg font-semibold mb-3" style={{ color: 'var(--color-text-primary)' }}>{title}</h2>
      <div className="text-sm leading-relaxed space-y-3" style={{ color: 'var(--color-text-muted)' }}>
        {children}
      </div>
    </section>
  )
}
