/// <reference types="@servicenow/glide" />
import { table, field } from '@servicenow/sdk/metadata'

/**
 * x_vuln_container_registry
 * Tracks container images and their scan status/risk posture.
 * Extends 'task' to inherit: number, state, assignment, SLA support.
 */
export default table({
  name: 'x_vuln_container_registry',
  label: 'Container Registry',
  labelPlural: 'Container Registries',
  extends: 'task',

  fields: {
    image_name: field.string({
      label: 'Image Name',
      mandatory: true,
      maxLength: 255,
      hint: 'e.g. nginx, my-org/my-app',
    }),
    image_tag: field.string({
      label: 'Image Tag',
      default: 'latest',
      maxLength: 128,
    }),
    registry_url: field.url({
      label: 'Registry URL',
      hint: 'e.g. registry.hub.docker.com, ghcr.io/my-org',
    }),
    digest: field.string({
      label: 'Image Digest (SHA256)',
      maxLength: 71,
      hint: 'sha256:abc123...',
    }),
    last_scanned: field.dateTime({ label: 'Last Scanned' }),
    scan_status: field.choice({
      label: 'Scan Status',
      default: 'pending',
      choices: [
        { value: 'pending',  label: 'Pending'  },
        { value: 'scanning', label: 'Scanning' },
        { value: 'complete', label: 'Complete' },
        { value: 'failed',   label: 'Failed'   },
      ],
    }),
    total_cves:     field.integer({ label: 'Total CVEs',     default: 0 }),
    critical_count: field.integer({ label: 'Critical Count', default: 0 }),
    high_count:     field.integer({ label: 'High Count',     default: 0 }),
    medium_count:   field.integer({ label: 'Medium Count',   default: 0 }),
    low_count:      field.integer({ label: 'Low Count',      default: 0 }),
    risk_score:     field.decimal({ label: 'Risk Score (0–100)', default: 0.0 }),
    risk_label:     field.string ({ label: 'Risk Label', readOnly: true }),
    owning_team:    field.reference({
      label: 'Owning Team',
      refTable: 'sys_user_group',
    }),
    environment: field.choice({
      label: 'Environment',
      default: 'dev',
      choices: [
        { value: 'prod',    label: 'Production'  },
        { value: 'staging', label: 'Staging'     },
        { value: 'dev',     label: 'Development' },
      ],
    }),
    scanner_name: field.string({ label: 'Scanner', hint: 'e.g. Trivy, Grype, Snyk' }),
  },
})
