# Deep Dive: `@servicenow/sdk-build-plugins` (v4.5.0)

`@servicenow/sdk-build-plugins` is the transformation and validation layer used by the SDK build pipeline. It hosts plugin implementations that parse, enrich, lint, and emit ServiceNow metadata artifacts.

## Evidence Source (`npm pack`)

Captured from `npm pack @servicenow/sdk-build-plugins` (tarball: `servicenow-sdk-build-plugins-4.5.0.tgz`):

- Name/version: `@servicenow/sdk-build-plugins@4.5.0`
- Main: `./dist/index.js`
- Engines: `node >=20.18.0`, `pnpm >=10.8.0`
- Runtime dependency count: `18`
- Tarball layout highlights: `dist/` (387 entries), `src/` (131 entries)

Notable dependencies from tarball `package.json`:

- `@servicenow/sdk-build-core@4.5.0`
- `@servicenow/sdk-core@4.5.0`
- `@servicenow/glide@27.0.5`
- `eslint@9.39.4`
- `@cyclonedx/cyclonedx-library@8.6.0`
- `fast-xml-parser@5.3.7`, `xmlbuilder2@3.1.1`, `xml-js@1.6.11`
- `zod@3.23.8`

## Functioning Model

```mermaid
flowchart TD
  IN[Source metadata + TS files] --> BC[@servicenow/sdk-build-core]
  BC --> PL[@servicenow/sdk-build-plugins]
  PL --> V[Validation plugins\nESLint, schema, metadata checks]
  PL --> X[XML transform plugins\nparse/build/emit]
  PL --> S[SBOM + package plugins\nCycloneDX + packageurl]
  V --> OUT[Compiled app artifact set]
  X --> OUT
  S --> OUT
```

## What This Means Operationally

- Build behavior is plugin-driven, not hard-coded in one monolithic compiler.
- XML and schema tooling in this layer are why metadata fidelity and repeatability stay high.
- Security/SBOM dependencies indicate this package also supports software composition visibility in build outputs.

## Source References

- `https://www.npmjs.com/package/@servicenow/sdk-build-plugins`
- `npm pack @servicenow/sdk-build-plugins`

## Tarball Evidence (from docs/npm-packs/extract)

- package.json highlights (servicenow-sdk-build-plugins-4.5.0/package/package.json):
  - `name: @servicenow/sdk-build-plugins`
  - `version: 4.5.0`
  - `main: ./dist/index.js`
  - `exports: { ".": "./dist/index.js" }`
  - `files: ["dist","src"]`
  - `engines: { node: ">=20.18.0", pnpm: ">=10.8.0" }`
  - `dependencies:`
    - `@servicenow/sdk-build-core@4.5.0`, `@servicenow/sdk-core@4.5.0`, `@servicenow/glide@27.0.5`
    - `eslint@9.39.4`, `eslint-formatter-stylish@8.40.0`, `@eslint-community/eslint-utils@4.9.1`, `globals@17.3.0`
    - `fast-xml-parser@5.3.7`, `xmlbuilder2@3.1.1`, `xml-js@1.6.11`
    - `@cyclonedx/cyclonedx-library@8.6.0`, `packageurl-js@2.0.1`, `mime-types@2.1.35`, `md5.js@1.3.5`
    - `lodash@4.17.23`, `zod@3.23.8`
  - `optionalDependencies: { libxmljs2: "0.37.0" }`
  - `overrides: { micromatch: "4.0.7" }`
- dist layout (selected):
  - `dist/index.js` (public barrel)
  - `dist/plugin/*` and multiple top-level modules implementing transforms for:
    - ACLs, applicability, app menus, business rules, client scripts, columns, data, email notifications
    - forms, HTML imports, import sets, instance scans, JSON, lists, Now Attach/Config/ID/Include/Ref
    - package JSON, properties, records, REST APIs, roles, script actions/includes, SLAs, static content
    - tables, UI actions/pages/policies, user preferences, UX list menu configs, views, workspaces

This corroborates the plugin registry’s breadth: validation, XML transforms, and SBOM/package metadata generation live here, driven by eslint + XML toolchain and SBOM libraries.
