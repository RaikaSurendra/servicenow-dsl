# ServiceNow Fluent DSL — Learning Hub

A structured, hands-on learning workspace for the **ServiceNow Fluent SDK** (v4.x),
custom community implementations, and a full production-grade MVP application.

## Structure

```
servicenow-dsl/
├── portal/                   ← Vercel-hosted learning portal (React 19 + Vite 6)
├── projects/
│   ├── 01-hello-fluent/      ← Chapter 1: SDK setup & first deploy
│   ├── 02-glide-api-basics/  ← Chapter 2: Glide API + TypeScript types
│   ├── 03-server-modules/    ← Chapter 3: Script Includes as ES modules
│   ├── 04-scripted-rest-api/ ← Chapter 4: Scripted REST APIs
│   ├── 05-ui-components/     ← Chapter 5: Now Experience React components
│   ├── 06-custom-glide-npm/  ← Chapter 6: servicenow-glide community package
│   ├── 07-fluent-mcp-ai/     ← Chapter 7: @modesty/fluent-mcp + AI dev
│   └── 08-vuln-mgmt-containers/ ← MVP: Container Vulnerability Management
├── shared/                   ← Shared TypeScript types and config templates
└── docs/                     ← Architecture docs, ADRs, chapter guides
```

## Quick Start

```bash
# 1. Clone and install
git clone <repo>
cd servicenow-dsl
npm install

# 2. Set up credentials (never commit .env)
cp .env.example .env
# Edit .env with your ServiceNow PDI details

# 3. Start the learning portal locally
npm run dev

# 4. Pick a chapter project
cd projects/01-hello-fluent
cp .env.example .env
# Follow the chapter README
```

## Prerequisites

- Node.js ≥ 22.0.0
- ServiceNow Personal Developer Instance (free at developer.servicenow.com)
- `@servicenow/sdk` CLI: `npm install -g @servicenow/sdk`

## Security

All ServiceNow instance credentials are loaded from environment variables.
**No credentials are ever committed to this repository.**
See `docs/credential-safety.md` for the full policy.

## Chapters

| # | Chapter | Focus |
|---|---------|-------|
| 1 | Hello Fluent | SDK install, `snc init`, first app deploy |
| 2 | Glide API Basics | GlideRecord, GlideSystem, TypeScript types |
| 3 | Server Modules | Script Includes as ES modules |
| 4 | Scripted REST API | REST API design with Fluent |
| 5 | UI Components | Now Experience React inside ServiceNow |
| 6 | Custom Glide NPM | Community `servicenow-glide` package |
| 7 | Fluent MCP + AI | AI-assisted development with `@modesty/fluent-mcp` |
| 8 | **MVP: Vuln Mgmt** | **Full Container Vulnerability Management app** |
