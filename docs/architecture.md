# Architecture Overview

## Monorepo Layout

```
servicenow-dsl/
├── portal/          Vercel SPA — learning portal (React 19 + Vite 6 + Tailwind 4)
├── projects/        ServiceNow Fluent SDK projects (one per chapter)
│   ├── 01–07        Progressive learning chapters
│   └── 08           MVP: Container Vulnerability Management
├── shared/          Cross-project TypeScript types and config templates
└── docs/            Architecture, ADRs, credential safety policy
```

## Portal (Vercel)

- **Framework**: React 19 + Vite 6 + Tailwind 4
- **Routing**: Client-side state machine (no react-router — same pattern as in-naamgpt)
- **Code highlighting**: Custom tokenizer (zero external JS libs)
- **Deployment**: `vercel.json` rewrites + security headers
- **No server-side code** — static SPA with no backend, no API keys in the browser

## ServiceNow Projects

Each project under `projects/` is an independent npm workspace with:
- `@servicenow/sdk` for the Fluent DSL CLI and metadata APIs
- `now.config.js` reading all credentials from environment variables
- `.env.example` committed; `.env` gitignored

## MVP: Container Vulnerability Management (Chapter 8)

### Layer diagram

```
External Scanner (Trivy/Grype/Snyk)
    │  POST /api/x_vuln_container/scan-ingest/v1/
    ▼
ScanIngestAPI (Scripted REST)
    │
    ├─► VulnScanImporter (Script Include)
    │       ├─► x_vuln_container_registry (table)
    │       ├─► x_vuln_finding (table)
    │       ├─► RiskScorer (Script Include)
    │       └─► RemediationManager (Script Include)
    │               └─► x_vuln_remediation_task (table)
    │
    └─► x_vuln_policy (table — SLA config)

DashboardStatsAPI (Scripted REST)
    │  GET /api/x_vuln_container/dashboard-stats/v1/
    ▼
x-vuln-dashboard (Now Experience web component)
    ├─► Risk KPI cards
    ├─► Severity bar chart
    └─► SLA breach counter
```

### Custom tables

| Table | Extends | Purpose |
|---|---|---|
| `x_vuln_container_registry` | task | Container image inventory + risk score |
| `x_vuln_finding` | — | One row per CVE per container |
| `x_vuln_remediation_task` | task | Work items to fix CVEs |
| `x_vuln_policy` | — | SLA hours + escalation config per severity |

### SLA policy (defaults)

| Severity | SLA | Auto-task |
|---|---|---|
| Critical | 24 hours | Yes — P1 |
| High | 7 days | Yes — P2 |
| Medium | 30 days | Yes — P3 |
| Low | 90 days | Manual |

## Adding a new learning project

1. Create `projects/NN-my-project/`
2. Copy `shared/config/now-config.template.js` → `now.config.js`
3. Copy `.env.example` from any existing project
4. Add a chapter entry to `portal/src/data/chapters.js`
5. Add chapter content at `portal/src/content/chNN.jsx`
6. Register lazy import in `portal/src/pages/ChapterPage.jsx`
