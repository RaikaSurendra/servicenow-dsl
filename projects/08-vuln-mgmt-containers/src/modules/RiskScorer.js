/// <reference types="@servicenow/glide" />

/**
 * RiskScorer
 * Calculates a composite risk score (0–100) for a container image
 * based on its open CVE findings.
 *
 * Weights:
 *   Critical × 10 | High × 5 | Medium × 2 | Low × 0.5
 *   Score capped at 100.
 */
export class RiskScorer {
  static WEIGHTS = { critical: 10, high: 5, medium: 2, low: 0.5 }

  calculate(containerSysId) {
    const counts = this._getOpenCounts(containerSysId)
    const raw = Object.entries(RiskScorer.WEIGHTS).reduce((sum, [sev, weight]) => {
      return sum + (counts[sev] || 0) * weight
    }, 0)
    return Math.min(Math.round(raw), 100)
  }

  getRiskLabel(score) {
    if (score >= 80) return 'Critical'
    if (score >= 60) return 'High'
    if (score >= 30) return 'Medium'
    if (score > 0)   return 'Low'
    return 'Clean'
  }

  getRiskColor(score) {
    if (score >= 80) return 'critical'
    if (score >= 60) return 'high'
    if (score >= 30) return 'medium'
    return 'low'
  }

  _getOpenCounts(containerSysId) {
    const counts = {}
    const ga = new GlideAggregate('x_vuln_finding')
    ga.addQuery('container', containerSysId)
    ga.addQuery('status', 'IN', 'open,in_progress')
    ga.groupBy('severity')
    ga.addAggregate('COUNT')
    ga.query()

    while (ga.next()) {
      counts[ga.getValue('severity')] = parseInt(ga.getAggregate('COUNT'))
    }
    return counts
  }
}
