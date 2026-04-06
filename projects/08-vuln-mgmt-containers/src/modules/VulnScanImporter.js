/// <reference types="@servicenow/glide" />
import { RiskScorer } from './RiskScorer'
import { RemediationManager } from './RemediationManager'

/**
 * VulnScanImporter
 * Processes raw scanner output (Trivy / Grype / Snyk JSON) and upserts
 * records in ServiceNow.
 *
 * Usage (from Scripted REST API handler):
 *   const importer = new VulnScanImporter()
 *   const result = importer.ingestScan({ imageName, imageTag, digest, findings })
 */
export class VulnScanImporter {
  constructor() {
    this._scorer  = new RiskScorer()
    this._remMgr  = new RemediationManager()
  }

  /**
   * @param {object} payload
   * @param {string} payload.imageName
   * @param {string} payload.imageTag
   * @param {string} [payload.digest]
   * @param {object[]} payload.findings  - Array of CVE objects from scanner
   * @param {string} [payload.scannerName]
   * @param {string} [payload.scannedAt]
   * @returns {{ containerSysId, created, updated, riskScore }}
   */
  ingestScan(payload) {
    const containerSysId = this._upsertContainer(payload)
    const { created, updated } = this._upsertFindings(containerSysId, payload.findings)

    // Recalculate risk score
    const riskScore = this._scorer.calculate(containerSysId)
    this._updateContainerRisk(containerSysId, riskScore, payload.findings)

    // Auto-create remediation tasks for critical/high findings
    this._remMgr.autoCreateTasks(containerSysId)

    return { containerSysId, created, updated, riskScore }
  }

  _upsertContainer({ imageName, imageTag, digest, scannerName, scannedAt }) {
    const gr = new GlideRecord('x_vuln_container_registry')
    gr.addQuery('image_name', imageName)
    gr.addQuery('image_tag',  imageTag)
    gr.query()

    if (gr.next()) {
      gr.setValue('last_scanned',  scannedAt || gs.nowDateTime())
      gr.setValue('scan_status',   'complete')
      gr.setValue('scanner_name',  scannerName || '')
      if (digest) gr.setValue('digest', digest)
      gr.update()
      return gr.getUniqueValue()
    }

    // New container
    gr.initialize()
    gr.setValue('image_name',   imageName)
    gr.setValue('image_tag',    imageTag)
    gr.setValue('last_scanned', scannedAt || gs.nowDateTime())
    gr.setValue('scan_status',  'complete')
    gr.setValue('scanner_name', scannerName || '')
    if (digest) gr.setValue('digest', digest)
    return gr.insert()
  }

  _upsertFindings(containerSysId, findings) {
    let created = 0
    let updated = 0

    for (const f of findings) {
      const existing = new GlideRecord('x_vuln_finding')
      existing.addQuery('container', containerSysId)
      existing.addQuery('cve_id',    f.cve_id)
      existing.addQuery('package_name', f.package_name)
      existing.query()

      if (existing.next()) {
        // Update severity/status if changed
        existing.setValue('cvss_score',      f.cvss_score || '')
        existing.setValue('severity',        f.severity)
        existing.setValue('fixed_version',   f.fixed_version || '')
        existing.setValue('has_fix',         !!f.fixed_version)
        existing.update()
        updated++
      } else {
        const gr = new GlideRecord('x_vuln_finding')
        gr.initialize()
        gr.setValue('container',       containerSysId)
        gr.setValue('cve_id',          f.cve_id)
        gr.setValue('cvss_score',      f.cvss_score || '')
        gr.setValue('severity',        f.severity)
        gr.setValue('package_name',    f.package_name)
        gr.setValue('package_version', f.package_version || '')
        gr.setValue('fixed_version',   f.fixed_version || '')
        gr.setValue('has_fix',         !!f.fixed_version)
        gr.setValue('description',     f.description || '')
        gr.setValue('published_date',  f.published_date || '')
        gr.setValue('status',          'open')
        gr.setValue('discovered_at',   gs.nowDateTime())
        this._setSLA(gr, f.severity)
        gr.insert()
        created++
      }
    }

    return { created, updated }
  }

  _setSLA(gr, severity) {
    const policyGr = new GlideRecord('x_vuln_policy')
    policyGr.addQuery('severity', severity)
    policyGr.addQuery('active', true)
    policyGr.query()

    if (policyGr.next()) {
      const hours = parseInt(policyGr.getValue('sla_hours'))
      const due = new GlideDateTime()
      due.addSeconds(hours * 3600)
      gr.setValue('sla_due_date', due.getValue())
    }
  }

  _updateContainerRisk(containerSysId, riskScore, findings) {
    const gr = new GlideRecord('x_vuln_container_registry')
    if (!gr.get(containerSysId)) return

    const counts = { critical: 0, high: 0, medium: 0, low: 0 }
    for (const f of findings) {
      if (counts.hasOwnProperty(f.severity)) counts[f.severity]++
    }

    gr.setValue('risk_score',     riskScore)
    gr.setValue('risk_label',     this._scorer.getRiskLabel(riskScore))
    gr.setValue('total_cves',     findings.length)
    gr.setValue('critical_count', counts.critical)
    gr.setValue('high_count',     counts.high)
    gr.setValue('medium_count',   counts.medium)
    gr.setValue('low_count',      counts.low)
    gr.update()
  }
}
