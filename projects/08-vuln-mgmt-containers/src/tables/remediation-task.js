/// <reference types="@servicenow/glide" />
import { table, field } from '@servicenow/sdk/metadata'

/**
 * x_vuln_remediation_task
 * Work items for remediating one or more CVEs on a container.
 * Extends 'task' — inherits number, assignment, state, SLA tracking.
 */
export default table({
  name: 'x_vuln_remediation_task',
  label: 'Remediation Task',
  labelPlural: 'Remediation Tasks',
  extends: 'task',

  fields: {
    container: field.reference({
      label: 'Container',
      refTable: 'x_vuln_container_registry',
      mandatory: true,
    }),
    finding_count: field.integer({ label: 'CVEs Addressed', default: 0 }),
    max_severity: field.choice({
      label: 'Highest Severity',
      choices: [
        { value: 'critical', label: 'Critical' },
        { value: 'high',     label: 'High'     },
        { value: 'medium',   label: 'Medium'   },
        { value: 'low',      label: 'Low'      },
      ],
    }),
    remediation_type: field.choice({
      label: 'Remediation Type',
      default: 'patch',
      choices: [
        { value: 'patch',   label: 'Patch / Update Package' },
        { value: 'rebuild', label: 'Rebuild Container Image' },
        { value: 'replace', label: 'Replace Base Image'      },
        { value: 'accept',  label: 'Accept Risk'             },
      ],
    }),
    target_version:   field.string({ label: 'Target Package Version' }),
    completed_at:     field.dateTime({ label: 'Completed At' }),
    verified_by:      field.reference({ label: 'Verified By', refTable: 'sys_user' }),
    verification_note: field.text({ label: 'Verification Notes' }),
  },
})
