/**
 * Shared TypeScript types used across ServiceNow Fluent DSL projects.
 * Import in any project: import type { ... } from '../../shared/types'
 */

// ─── Severity ────────────────────────────────────────────────────────────────

export type Severity = 'critical' | 'high' | 'medium' | 'low' | 'info'

export const SEVERITY_ORDER: Severity[] = ['critical', 'high', 'medium', 'low', 'info']

export function compareSeverity(a: Severity, b: Severity): number {
  return SEVERITY_ORDER.indexOf(a) - SEVERITY_ORDER.indexOf(b)
}

// ─── CVE / Finding ───────────────────────────────────────────────────────────

export interface CveFinding {
  cve_id:           string
  severity:         Severity
  cvss_score?:      number
  cvss_vector?:     string
  package_name:     string
  package_version:  string
  fixed_version?:   string
  has_fix:          boolean
  description?:     string
  published_date?:  string
}

export interface ScanPayload {
  image_name:   string
  image_tag:    string
  digest?:      string
  scanner?:     string
  scanned_at?:  string
  environment?: 'prod' | 'staging' | 'dev'
  findings:     CveFinding[]
}

export interface ScanIngestResult {
  container_sys_id: string
  findings_created: number
  findings_updated: number
  risk_score:       number
}

// ─── Dashboard ───────────────────────────────────────────────────────────────

export interface DashboardStats {
  by_severity:    Record<Severity, number>
  recent_scans:   number
  avg_risk_score: number
  sla_breaches:   number
  as_of:          string
}

// ─── Risk ─────────────────────────────────────────────────────────────────────

export type RiskLabel = 'Critical' | 'High' | 'Medium' | 'Low' | 'Clean'

export interface RiskSummary {
  score:     number
  label:     RiskLabel
  counts:    Record<Severity, number>
}

// ─── Remediation ─────────────────────────────────────────────────────────────

export type RemediationType = 'patch' | 'rebuild' | 'replace' | 'accept'

export interface RemediationTask {
  sys_id:            string
  container_sys_id:  string
  short_description: string
  max_severity:      Severity
  finding_count:     number
  remediation_type:  RemediationType
  state:             string
  created_at:        string
  due_date?:         string
}
