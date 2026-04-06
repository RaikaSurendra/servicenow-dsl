/**
 * seed-cves.js — Loads mock CVE data into your ServiceNow PDI
 *
 * Usage:
 *   node scripts/seed-cves.js
 *   SEED_DRY_RUN=true node scripts/seed-cves.js    (preview without writing)
 *
 * Credentials are read from .env — NEVER passed as CLI arguments.
 */

import 'dotenv/config'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))

const INSTANCE_URL = process.env.SN_INSTANCE_URL
const USERNAME     = process.env.SN_USERNAME
const PASSWORD     = process.env.SN_PASSWORD
const DRY_RUN      = process.env.SEED_DRY_RUN === 'true'

if (!INSTANCE_URL || !USERNAME || !PASSWORD) {
  console.error('ERROR: Missing SN_INSTANCE_URL, SN_USERNAME, or SN_PASSWORD in .env')
  process.exit(1)
}

const seedData = JSON.parse(
  readFileSync(join(__dirname, '../seed-data/mock-cves.json'), 'utf8')
)

const headers = {
  'Content-Type': 'application/json',
  'Accept': 'application/json',
  'Authorization': 'Basic ' + Buffer.from(`${USERNAME}:${PASSWORD}`).toString('base64'),
}

async function ingestContainer(container) {
  const payload = {
    image_name:  container.image_name,
    image_tag:   container.image_tag,
    digest:      container.digest,
    scanner:     container.scanner,
    environment: container.environment,
    findings:    container.findings,
    scanned_at:  new Date().toISOString(),
  }

  if (DRY_RUN) {
    console.log(`[DRY RUN] Would ingest: ${container.image_name}:${container.image_tag} (${container.findings.length} CVEs)`)
    return
  }

  const url = `${INSTANCE_URL}/api/x_vuln_container/scan-ingest/v1/`
  const res = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  })

  if (!res.ok) {
    const text = await res.text()
    console.error(`FAILED ${container.image_name}: HTTP ${res.status} — ${text}`)
    return
  }

  const result = await res.json()
  console.log(`✓ Ingested ${container.image_name}:${container.image_tag} → risk score: ${result.result?.risk_score ?? '?'}`)
}

console.log(`Seeding ${seedData.containers.length} containers into ${INSTANCE_URL}`)
if (DRY_RUN) console.log('(DRY RUN mode — no data will be written)')

for (const container of seedData.containers) {
  await ingestContainer(container)
}

console.log('Seed complete.')
