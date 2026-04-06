/// <reference types="@servicenow/glide" />
import { restAPI, resource, GET } from '@servicenow/sdk/rest'

/**
 * DashboardStatsAPI
 * Aggregated statistics for the vulnerability dashboard UI.
 *
 * GET /api/x_vuln_container/dashboard-stats/v1/
 * Response: { by_severity, recent_scans, avg_risk_score, sla_breaches, as_of }
 */
export default restAPI({
  name: 'DashboardStatsAPI',
  basePath: '/dashboard-stats',
  version: 'v1',

  resources: [
    resource({
      relativePath: '/',
      methods: [
        GET(function handler() {
          // 1. Open findings by severity
          const sevGa = new GlideAggregate('x_vuln_finding')
          sevGa.addQuery('status', 'IN', 'open,in_progress')
          sevGa.groupBy('severity')
          sevGa.addAggregate('COUNT')
          sevGa.query()

          const bySeverity = { critical: 0, high: 0, medium: 0, low: 0, info: 0 }
          while (sevGa.next()) {
            const sev = sevGa.getValue('severity')
            if (bySeverity.hasOwnProperty(sev)) {
              bySeverity[sev] = parseInt(sevGa.getAggregate('COUNT'))
            }
          }

          // 2. Containers scanned in last 7 days
          const scanGa = new GlideAggregate('x_vuln_container_registry')
          scanGa.addQuery('last_scanned', '>=', gs.daysAgo(7))
          scanGa.addQuery('scan_status', 'complete')
          scanGa.addAggregate('COUNT')
          scanGa.query()
          scanGa.next()
          const recentScans = parseInt(scanGa.getAggregate('COUNT')) || 0

          // 3. Average risk score across all containers
          const riskGa = new GlideAggregate('x_vuln_container_registry')
          riskGa.addAggregate('AVG', 'risk_score')
          riskGa.query()
          riskGa.next()
          const avgRisk = parseFloat(riskGa.getAggregate('AVG', 'risk_score') || '0')

          // 4. SLA breaches (open findings past due date)
          const slaGr = new GlideRecord('x_vuln_finding')
          slaGr.addQuery('status', 'IN', 'open,in_progress')
          slaGr.addNotNullQuery('sla_due_date')
          slaGr.addQuery('sla_due_date', '<', gs.nowDateTime())
          slaGr.query()
          const slaBreaches = slaGr.getRowCount()

          // 5. Top 5 riskiest containers
          const topGr = new GlideRecord('x_vuln_container_registry')
          topGr.orderByDesc('risk_score')
          topGr.setLimit(5)
          topGr.query()

          const topContainers = []
          while (topGr.next()) {
            topContainers.push({
              sys_id:     topGr.getUniqueValue(),
              image:      topGr.getValue('image_name') + ':' + topGr.getValue('image_tag'),
              risk_score: parseFloat(topGr.getValue('risk_score')),
              risk_label: topGr.getValue('risk_label'),
              critical:   parseInt(topGr.getValue('critical_count')),
              high:       parseInt(topGr.getValue('high_count')),
            })
          }

          this.response.setStatus(200)
          this.response.setBody({
            result: {
              by_severity:      bySeverity,
              recent_scans:     recentScans,
              avg_risk_score:   Math.round(avgRisk * 10) / 10,
              sla_breaches:     slaBreaches,
              top_containers:   topContainers,
              as_of:            gs.nowDateTime(),
            },
          })
        }),
      ],
    }),
  ],
})
