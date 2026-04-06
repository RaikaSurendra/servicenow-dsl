/// <reference types="@servicenow/glide" />

/**
 * RemediationManager
 * Auto-creates remediation tasks for containers with open Critical/High CVEs
 * when no task already exists.
 */
export class RemediationManager {
  autoCreateTasks(containerSysId) {
    const findings = this._getActionableFindings(containerSysId)
    if (findings.length === 0) return

    const maxSeverity = this._getMaxSeverity(findings)

    // Skip if an open remediation task already exists for this container + severity
    if (this._hasOpenTask(containerSysId, maxSeverity)) return

    const taskSysId = this._createTask(containerSysId, findings, maxSeverity)
    this._linkFindingsToTask(findings, taskSysId)

    gs.info(`RemediationManager: created task ${taskSysId} for container ${containerSysId}`)
  }

  resolveTask(taskSysId, verifiedByUserId, note) {
    const gr = new GlideRecord('x_vuln_remediation_task')
    if (!gr.get(taskSysId)) return false

    gr.setValue('state',              '3')  // Closed Complete
    gr.setValue('completed_at',       gs.nowDateTime())
    gr.setValue('verified_by',        verifiedByUserId)
    gr.setValue('verification_note',  note || '')
    gr.update()

    // Mark linked findings as resolved
    const finding = new GlideRecord('x_vuln_finding')
    finding.addQuery('remediation_task', taskSysId)
    finding.addQuery('status', 'in_progress')
    finding.query()

    while (finding.next()) {
      finding.setValue('status',      'resolved')
      finding.setValue('resolved_at', gs.nowDateTime())
      finding.setValue('resolved_by', verifiedByUserId)
      finding.update()
    }

    return true
  }

  _getActionableFindings(containerSysId) {
    const results = []
    const gr = new GlideRecord('x_vuln_finding')
    gr.addQuery('container', containerSysId)
    gr.addQuery('severity', 'IN', 'critical,high')
    gr.addQuery('status', 'open')
    gr.query()

    while (gr.next()) {
      results.push({
        sysId:   gr.getUniqueValue(),
        cveId:   gr.getValue('cve_id'),
        severity: gr.getValue('severity'),
      })
    }
    return results
  }

  _getMaxSeverity(findings) {
    return findings.some(f => f.severity === 'critical') ? 'critical' : 'high'
  }

  _hasOpenTask(containerSysId, maxSeverity) {
    const gr = new GlideRecord('x_vuln_remediation_task')
    gr.addQuery('container',     containerSysId)
    gr.addQuery('max_severity',  maxSeverity)
    gr.addQuery('state',         'IN', '1,2')  // New, In Progress
    gr.query()
    return gr.next()
  }

  _createTask(containerSysId, findings, maxSeverity) {
    const containerGr = new GlideRecord('x_vuln_container_registry')
    containerGr.get(containerSysId)
    const imageName = containerGr.getValue('image_name') + ':' + containerGr.getValue('image_tag')

    const gr = new GlideRecord('x_vuln_remediation_task')
    gr.initialize()
    gr.setValue('container',          containerSysId)
    gr.setValue('short_description',  `Remediate ${maxSeverity.toUpperCase()} CVEs on ${imageName}`)
    gr.setValue('max_severity',       maxSeverity)
    gr.setValue('finding_count',      findings.length)
    gr.setValue('priority',           maxSeverity === 'critical' ? '1' : '2')
    gr.setValue('state',              '1')  // New
    return gr.insert()
  }

  _linkFindingsToTask(findings, taskSysId) {
    for (const { sysId } of findings) {
      const gr = new GlideRecord('x_vuln_finding')
      if (gr.get(sysId)) {
        gr.setValue('remediation_task', taskSysId)
        gr.setValue('status', 'in_progress')
        gr.update()
      }
    }
  }
}
