# Deep Dive: `@servicenow/sdk-core` (v4.5.0)

## What This Package Is

`@servicenow/sdk-core` is the **metadata type system** for the ServiceNow SDK. It defines TypeScript schemas and models for every ServiceNow artifact type that the SDK can build, validate, or deploy. Think of it as the SDK's domain language — everything from table columns to flow actions is described here.

At 5.72 MB and 1,635 files, its size reflects breadth: it covers the full range of ServiceNow platform record types that a scoped application can contain.

---

## Package Identity

| Field | Value |
|---|---|
| Name | `@servicenow/sdk-core` |
| Version | `4.5.0` |
| Types entry | `dist/global/index.d.ts` |
| Runtime dependencies | **None** — contract-only package |
| Node.js required | `>= 20.18.0` |
| Package manager | `pnpm >= 10.8.0` |
| Unpacked size | ~5.72 MB / 1,635 files |

---

## Export Surface

```json
{
  "exports": {
    "./global":     "./dist/global/index.d.ts",
    "./*":          "./src/*/index.ts",
    "./runtime/*":  "./dist/*/index.js"
  }
}
```

Three distinct entry points with different consumers:

| Entry | Consumer | What it provides |
|---|---|---|
| `./global` | TypeScript editors, IDE plugins | Compiled `.d.ts` types for the full metadata surface |
| `./src/*` | Build tools that import TypeScript source directly | Raw source — e.g. `@servicenow/sdk-core/flow` |
| `./runtime/*` | SDK packages at build time | Compiled JavaScript runtime helpers |

---

## Source Directory Structure (`src/`)

The package is organized by **platform domain**. Each folder is a self-contained module:

```
src/
├── app/              ← Application-level records: ApplicationMenu, Property,
│                       UserPreference, CrossScopePrivilege, BusinessRule,
│                       Acl, Role, Test, ImportSet, Sla, JsonSerializable
│
├── db/               ← Database layer: Table, Record, Column
│                       Field types: Choice, String, Integer, Boolean, Date, Script,
│                       TableName, DocumentId, Reference, List, Decimal, DomainId,
│                       DomainPath, TemplateValue, TranslatedField, UserRoles,
│                       BasicImage, Conditions, TranslatedText, Version,
│                       SystemClassName, FieldName, Radio, Generic, Guid,
│                       Password2, Json
│
├── flow/             ← Flow Designer: Flow, Subflow, Action, Trigger,
│                       InlineScript, dataPill, ApprovalRules, ApprovalDueDate,
│                       FlowLogic, FlowVariables, flow-data-helpers
│
├── fluent/           ← Generated fluent type helpers for dependency records
│
├── global/           ← Global type augmentation and re-export barrel
│
├── service-catalog/  ← Catalog items, catalog scripts, catalog UI policies
│
├── service-portal/   ← Portal components: Widget, Dependency, AngularProvider,
│                       Portal, Page, Theme, Menu
│
├── ui/               ← UI layer: UIPage, UIAction, UIPolicy
│
├── util/             ← Shared utilities
│
├── rest/             ← REST API descriptor types
│
├── script/           ← Script Include types
│
├── clientscript/     ← Client Script types
│
├── dashboard/        ← Dashboard descriptor types
│
├── instancescan/     ← Instance Scan check types
│
├── notification/     ← Email notification descriptor types
│
└── uxf/              ← UX Framework (Next Experience) types
```

---

## Key Type Families

### Database Layer (`src/db/`)

```ts
// Table definition
export * from './Table'     // { name, label, extends, columns, ... }
export * from './Record'    // base record shape
export * from './Column'    // column descriptor

// Every ServiceNow field type
export * from './types/String'
export * from './types/Integer'
export * from './types/Boolean'
export * from './types/Date'
export * from './types/Script'        // server-side script field
export * from './types/Reference'     // reference field (FK to another table)
export * from './types/List'          // list-type field
export * from './types/Choice'        // choice list field
export * from './types/Guid'          // sys_id type
export * from './types/Password2'     // encrypted password field
export * from './types/Json'          // JSON blob field
export * from './types/TranslatedText'
export * from './types/Conditions'    // encoded query string type
// ... 15 more field types
```

These types are used by `sdk-build-plugins`'s `column-plugin`, `table-plugin`, and `record-plugin` to validate that your metadata files use correct field types.

### Application Layer (`src/app/`)

```ts
export * from './ApplicationMenu'     // nav menu items
export * from './Property'            // sys_properties records
export * from './UserPreference'      // sys_user_preference records
export * from './CrossScopePrivilege' // cross-scope API privilege grants
export * from './BusinessRule'        // sys_script records
export * from './Acl'                 // sys_security_acl records
export * from './Role'                // sys_user_role records
export * from './Test'                // ATF test definitions
export * from './ImportSet'           // sys_transform_map
export * from './Sla'                 // contract_sla records

// Shared utility type
export type JsonSerializable =
  | string | number | boolean | null
  | JsonSerializable[]
  | { [key: string]: JsonSerializable }
```

### Flow Layer (`src/flow/`)

The flow module defines the **authoring schema** for Flow Designer artifacts — what you write in your `.ts` project files when building flows:

```ts
export * from './Flow'           // FlowDefinition, Flow builder
export * from './Subflow'        // SubflowDefinition
export * from './FlowTypes'      // type aliases for flow data types
export * from './FlowVariables'  // input/output variable descriptors
export * from './transform'      // transform/mapping types
export * from './built-ins'      // built-in step types

// Data pill and approval helpers
export { InlineScript, dataPill, ApprovalRules, ApprovalDueDate } from './flow-data-helpers'

// FlowLogic (branching, conditions, parallel branches)
import { FlowLogic } from './flow-logic'

// Flow data type system
export type {
  ArrayFlowDataType,
  FlowDataType,
  ApprovalRulesType,
  ApprovalConditionRuleType,
  ApprovalRuleActionType,
  ApprovalRuleConditionType,
  ApprovalRuleSetType,
  ApprovalDueDateType
} from './flow-data-helpers'

export { ARRAY_FLOW_DATA_TYPES } from './flow-data-helpers'
```

Flow Designer actions written in TypeScript DSL use these types. The `sdk-build-plugins` flow plugins (`flow-definition-plugin`, `flow-action-definition-plugin`, `step-definition-plugin`, etc.) consume these schemas to validate and transform your flow source into platform XML.

---

## How `sdk-core` Connects to Other Packages

```
@servicenow/sdk-core  (schemas, types, contracts)
      │
      ├── consumed by @servicenow/sdk-build-core
      │     → compiler engine uses Record/Table/Column types
      │
      ├── consumed by @servicenow/sdk-build-plugins
      │     → each plugin validates metadata against these schemas
      │     → RecordPlugin uses TableOwnership (maps table names to plugin sys_ids)
      │     → column-plugin validates Column types against db/types/*
      │     → flow plugins use Flow, Subflow, FlowVariables
      │
      └── consumed by @servicenow/sdk-api
            → Orchestrator uses NowConfig type (from sdk-build-core, which imports sdk-core)
            → ApplicationDependencies maps now.config.json dependency specs to core types
```

---

## The `global/` Barrel and Type Augmentation

`src/global/index.ts` re-exports types that need to be globally available to TypeScript consumers:

```ts
export * from './unresolved'       // Now.Unresolved type for forward references
export * from './Keys'             // Now.Keys — the keys registry type
export * from './Tables'           // Now.Tables — global table type map
export * from './tagged-templates' // script`...`, Now.ID`...` tagged templates
export * from './include'          // Now.Include for Script Include references
export * from './image'            // Now.Image type
export * from './ref'              // Now.Ref — typed record references
export * from './data-helpers'     // data accessors
import './attach'                  // installs global type augmentation (side effect)
```

The `./attach` side-effect import augments the global TypeScript scope so that `Now.ID`, `Now.Ref`, `script` tagged template literals, and similar patterns are available in your project's TypeScript files without explicit imports.

---

## Version History and Growth

The version naming reflects ServiceNow platform releases:

| SDK Version | Platform Codename | Notes |
|---|---|---|
| `1.0.6` | Washington DC | Early release |
| `3.0.2` | Xanadu | Major schema expansion |
| `4.5.0` | Yokohama/current | 1,635 files, 5.72 MB |

The growth in file count directly corresponds to the number of ServiceNow record types the SDK supports building. Each new platform release adds record types (UX components, AI agent configs, dashboard widgets, etc.) that require new schemas.

---

## Why No Runtime Dependencies?

This package has zero runtime dependencies in `package.json`. The approach is intentional:

1. **Stability** — consumers don't inherit transitive dependency risks from this contract layer
2. **Tree-shaking** — bundlers can include only the schemas actually used
3. **Isomorphism** — schemas work identically in Node.js, browser, and type-checking contexts
4. **Portability** — can be imported by any tool in the ecosystem without dependency conflicts

Validation logic that requires a runtime library (like `zod`) lives in `sdk-api` and `sdk-build-plugins`, not here.

---

## Architecture Summary

```
@servicenow/sdk-core
│
├── src/db/        ← Table + Record + 25 Column field types
├── src/app/       ← 10 application artifact types (Rule, ACL, Role, ...)
├── src/flow/      ← Flow/Subflow/Action DSL types + FlowLogic
├── src/global/    ← Global type augmentation (Now.ID, Now.Keys, Now.Ref, ...)
├── src/ui/        ← UIPage, UIAction, UIPolicy
├── src/script/    ← Script Include schema
├── src/clientscript/ ← Client Script schema
├── src/rest/      ← REST API descriptor schema
├── src/service-catalog/ ← Catalog item schemas
├── src/service-portal/  ← Portal component schemas
├── src/dashboard/ ← Dashboard widget schemas
├── src/uxf/       ← Next Experience UX component schemas
├── src/instancescan/ ← Instance Scan check schemas
├── src/notification/ ← Email notification schemas
├── src/util/      ← Shared type utilities
└── src/fluent/    ← Fluent-generated dependency type helpers
```

---

## Source References

- `docs/npm-packs/extract/servicenow-sdk-core-4.5.0/package/src/`
- `https://www.npmjs.com/package/@servicenow/sdk-core`
