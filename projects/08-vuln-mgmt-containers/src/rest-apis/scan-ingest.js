/// <reference types="@servicenow/glide" />
import { restAPI, resource, POST } from '@servicenow/sdk/rest'
import { VulnScanImporter } from '../modules/VulnScanImporter'

/**
 * ScanIngestAPI
 * Receives CVE scan payloads from external scanners (Trivy, Grype, Snyk).
 *
 * POST /api/x_vuln_container/scan-ingest/v1/
 * Body: { image_name, image_tag, digest?, scanner?, findings: CveFinding[] }
 */
export default restAPI({
  name: 'ScanIngestAPI',
  basePath: '/scan-ingest',
  version: 'v1',

  resources: [
    resource({
      relativePath: '/',
      methods: [
        POST(function handler() {
          let body
          try {
            body = JSON.parse(this.request.body.dataString)
          } catch (_) {
            this.response.setStatus(400)
            this.response.setBody({ error: 'Invalid JSON body' })
            return
          }

          if (!body.image_name) {
            this.response.setStatus(400)
            this.response.setBody({ error: 'image_name is required' })
            return
          }
          if (!Array.isArray(body.findings)) {
            this.response.setStatus(400)
            this.response.setBody({ error: 'findings must be an array' })
            return
          }

          try {
            const importer = new VulnScanImporter()
            const result = importer.ingestScan({
              imageName:   body.image_name,
              imageTag:    body.image_tag    || 'latest',
              digest:      body.digest,
              findings:    body.findings,
              scannerName: body.scanner      || 'unknown',
              scannedAt:   body.scanned_at   || gs.nowDateTime(),
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
            gs.error('ScanIngestAPI: ' + e.message)
            this.response.setStatus(500)
            this.response.setBody({ error: 'Ingest failed — see system logs' })
          }
        }),
      ],
    }),
  ],
})
