# Deep Dive: `@servicenow/sdk-core` (v4.5.0)

`@servicenow/sdk-core` is the metadata type-system backbone of the ServiceNow SDK ecosystem. It provides strongly typed models and validation schemas used by build plugins, API orchestration, and compile-time checks.

## Package Identity

| Field | Value |
|---|---|
| Name | `@servicenow/sdk-core` |
| Version | `4.5.0` |
| License | `MIT` |
| TypeScript declarations | `dist/global/index.d.ts` |
| Unpacked size | 6,002,721 bytes (~5.72 MB) |
| File count | 1,635 |
| Node.js required | `>= 20.18.0` |
| Package manager | `pnpm >= 10.8.0` |

Additional registry context:

- `latest` dist-tag is `4.5.0`
- historical tags include `xanadu: 3.0.2`, `washingtondc: 1.0.6`
- package description: `ServiceNow SDK - Core`

## Export Surface

`@servicenow/sdk-core@4.5.0` exports:

- `./* -> ./src/*/index.ts`
- `./global -> ./dist/global/index.d.ts`
- `./runtime/* -> ./dist/*/index.js`

This split gives build-time type contracts (`./global`) and runtime-targeted artifacts (`./runtime/*`) while preserving source-oriented entry points.

## Runtime Dependencies

For `4.5.0`, the registry metadata indicates no explicit runtime dependency list on the package manifest (contrast with older `1.x/2.x` lines that listed `zod`).

That reinforces `sdk-core` as a mostly contract-heavy package where size comes from schema/type coverage rather than broad runtime library composition.

## Why It Matters

This package is where the SDK encodes what “valid ServiceNow metadata” looks like.

Without `sdk-core`:

- Plugin validation would drift across packages
- TypeScript types would diverge from runtime validation
- Compiler diagnostics would be less deterministic

With `sdk-core`:

- Shared schemas drive both type inference and runtime checks
- Build plugins can validate records consistently
- SDK evolution can stay contract-driven across layers

## Core Concepts

### 1) Schema-First Modeling

A schema-first approach allows the same definition family to power:

- Runtime validation
- Static TypeScript types
- Better diagnostics for malformed metadata

### 2) Metadata Surface Coverage

The package tends to be large because it tracks many metadata object families:

- Application-level records
- Table and dictionary structures
- Script includes and scripted APIs
- UI and experience metadata
- Security-related records and associations

As platform coverage grows, schema count and file count grow with it.

The size growth from early releases to `4.5.0` (1,635 files) reflects broad platform metadata support and richer generated contract surfaces.

### 3) Stability Through Contracts

`sdk-core` provides shared contracts consumed by:

- `@servicenow/sdk-build-core`
- `@servicenow/sdk-build-plugins`
- `@servicenow/sdk-api`

This keeps pipeline behavior predictable when moving from local compile to instance deployment.

## Architecture Position

```text
@servicenow/sdk-core
   ├── metadata schemas
   ├── type models
   └── validation contracts

Consumed by:
   ├── sdk-build-core       (compiler engine)
   ├── sdk-build-plugins    (record transformers)
   └── sdk-api              (orchestration + operations)
```

## UML: Contract Consumption Flow

```mermaid
flowchart TD
  CORE[@servicenow/sdk-core\nSchemas + Types + Contracts]
  BC[@servicenow/sdk-build-core]
  BP[@servicenow/sdk-build-plugins]
  API[@servicenow/sdk-api]
  OUT[Consistent validation + deterministic builds]

  CORE --> BC
  CORE --> BP
  CORE --> API
  BC --> OUT
  BP --> OUT
  API --> OUT
```

## Practical Engineering Implications

- Treat schema updates as contract changes.
- Validate generated metadata as early as possible in build pipelines.
- Keep plugin logic aligned to shared `sdk-core` types to avoid custom drift.
- Pin SDK versions in CI to keep schema behavior stable.

## The Big Picture

`@servicenow/sdk-core` is the **contract layer** of the ServiceNow SDK ecosystem. It is intentionally broad because it encodes the metadata language that every higher-level package depends on.

## Source References

- `https://www.npmjs.com/package/@servicenow/sdk-core`
- `https://registry.npmjs.org/@servicenow%2Fsdk-core`
