/// <reference types="@servicenow/glide" />
import { table, field } from '@servicenow/sdk/metadata'

/**
 * x_vuln_policy
 * Org-level vulnerability SLA policies — one row per severity.
 * Seeded with defaults on first install.
 */
export default table({
  name: 'x_vuln_policy',
  label: 'Vulnerability Policy',
  labelPlural: 'Vulnerability Policies',

  fields: {
    severity: field.choice({
      label: 'Severity',
      mandatory: true,
      choices: [
        { value: 'critical', label: 'Critical' },
        { value: 'high',     label: 'High'     },
        { value: 'medium',   label: 'Medium'   },
        { value: 'low',      label: 'Low'      },
      ],
    }),
    sla_hours:          field.integer({ label: 'SLA (hours)',    mandatory: true }),
    auto_create_task:   field.boolean({ label: 'Auto-Create Remediation Task', default: true }),
    escalation_role:    field.reference({ label: 'Escalation Group', refTable: 'sys_user_group' }),
    notify_on_breach:   field.boolean({ label: 'Notify on SLA Breach', default: true }),
    active:             field.boolean({ label: 'Policy Active', default: true }),
    notes:              field.text({ label: 'Policy Notes' }),
  },
})
