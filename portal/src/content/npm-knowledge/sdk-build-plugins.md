# Deep Dive: `@servicenow/sdk-build-plugins` (v4.5.0)

## What This Package Is

`@servicenow/sdk-build-plugins` is the **transformation and validation engine** for the ServiceNow SDK build pipeline. It is a registry of plugins — each plugin knows how to read, validate, transform, and emit one or more ServiceNow metadata record types. Every artifact in a ServiceNow scoped app (ACLs, business rules, flows, UI components, catalog items, etc.) passes through a corresponding plugin during `snc build`.

---

## Package Identity

| Field | Value |
|---|---|
| Name | `@servicenow/sdk-build-plugins` |
| Version | `4.5.0` |
| Main entry | `./dist/index.js` |
| Node.js required | `>= 20.18.0` |
| Package manager | `pnpm >= 10.8.0` |
| Dist files | 387 entries |
| Src files | 131 entries |

---

## The Plugin Architecture

Every exported plugin implements the `Plugin` interface from `@servicenow/sdk-build-core`:

```ts
import { Plugin } from '@servicenow/sdk-build-core'

// A plugin is a named transformation unit
type Plugin = {
  name: string
  // registers handlers for specific metadata table types
  // and runs them in the build compiler context
}
```

The `@servicenow/sdk-build-core` compiler (consumed by `sdk-api`) calls each plugin in sequence. Plugins receive a build `Context` with access to:
- The source metadata file
- The `FileSystem` abstraction
- The `Keys` registry (stable sys_id references)
- TypeScript diagnostic reporting
- The `Logger`

Plugins emit validated, transformed XML output to the build artifact directory.

---

## Full Plugin Registry (`dist/index.d.ts`)

These are all exported plugins and utilities:

### Core Metadata Plugins

| Export | What it handles |
|---|---|
| `AclPlugin` | `sys_security_acl` — access control rules |
| `BusinessRulePlugin` | `sys_script` — server-side business rules |
| `ScriptIncludePlugin` | `sys_script_include` — reusable server-side libraries |
| `RecordPlugin` | Generic record transform + `TableOwnership` registry |
| `TablePlugin` | `sys_db_object` + `sys_dictionary` — table and column definitions |
| `ColumnPlugin` | Column-level transform within table definitions |
| `DataPlugin` | Arbitrary table data records |
| `RolePlugin` | `sys_user_role` — role definitions |
| `PropertyPlugin` | `sys_properties` — system properties |
| `UserPreferencePlugin` | `sys_user_preference` — user preference defaults |
| `ApplicationMenuPlugin` | `sys_app_application` — application menu items |
| `ViewPlugin` | `sys_ui_view` — view definitions |
| `CrossScopePrivilegePlugin` | `sys_scope_privilege` — cross-scope access grants |

### Script and Syntax Plugins

| Export | What it handles |
|---|---|
| `ClientScriptPlugin` | `sys_script_client` — client-side scripts |
| `BasicSyntaxPlugin` | Validates basic JavaScript syntax |
| `ArrowFunctionPlugin` | Transforms/validates arrow function usage |
| `CallExpressionPlugin` | Validates function call patterns |
| `ServerModulePlugin` | Server module script handling |
| `NowIdPlugin` | `Now.ID` tagged template literal resolution |
| `NowRefPlugin` | `Now.Ref` typed reference resolution |
| `NowIncludePlugin` | `Now.Include` (Script Include references) |
| `NowUnresolvedPlugin` | Detects unresolved `Now.*` references |
| `NowConfigPlugin` | Validates and processes `now.config.json` |
| `PackageJsonPlugin` | Validates project `package.json` |

### UI and Experience Plugins

| Export | What it handles |
|---|---|
| `UiPagePlugin` | `sys_ui_page` — legacy UI pages |
| `UiActionPlugin` | `sys_ui_action` — UI actions (buttons, context menu) |
| `UiPolicyPlugin` | `sys_ui_policy` — client-side UI policies |
| `HtmlImportPlugin` | HTML template imports |
| `StaticContentPlugin` | Static files (CSS, JS, images) |
| `JsonPlugin` | JSON configuration files |
| `NowAttachPlugin` | `Now.Attach` file attachment handling |

### Flow Designer Plugins

| Export | What it handles |
|---|---|
| `FlowDefinitionPlugin` | `sys_hub_flow` — flow definitions |
| `FlowActionDefinitionPlugin` | `sys_hub_action_type_definition` — action definitions |
| `StepDefinitionPlugin` | `sys_flow_step_definition` — step definitions |
| `StepInstancePlugin` | `sys_hub_step_instance` — step instances |
| `FlowInstancePlugin` | `sys_hub_trigger_instance_v2` — flow instances |
| `FlowTriggerInstancePlugin` | `sys_hub_trigger_instance_v2` — trigger instances |
| `TriggerPlugin` | Trigger record transformation |
| `WfaDatapillPlugin` | Workflow action data pill resolution |
| `InlineScriptPlugin` | Inline script blocks in flow actions |
| `ApprovalRulesPlugin` | Approval rules within flows |
| `FlowDiagnosticsPlugin` | Flow-specific diagnostic reporting |
| `FlowLogicPlugin` | `sys_hub_flow_logic_instance_v2` — flow logic (branching) |
| `FlowActivationTask` | Post-install task to activate flows |
| `FlowLogicValueProcessor` | Processes flow logic branch values |
| `FLOW_LOGIC` | Constants for flow logic types |

### REST and Integration Plugins

| Export | What it handles |
|---|---|
| `RestApiPlugin` | `sys_ws_definition` + operations — scripted REST APIs |
| `ScriptActionPlugin` | `sysevent_script_action` — event-triggered scripts |
| `ScheduleScript` | `sysauto_script` — scheduled jobs |
| `EmailNotificationPlugin` | `sysevent_email_action` — email notifications |
| `ImportSetsPlugin` | `sys_transform_map` — import set transforms |
| `SlaPlugin` | `contract_sla` — SLA definitions |

### Service Portal Plugins

| Export | What it handles |
|---|---|
| `WidgetPlugin` | `sp_widget` — Service Portal widgets |
| `DependencyPlugin` | `sp_dependency` — widget dependencies |
| `AngularProviderPlugin` | `sp_angular_provider` — AngularJS providers |
| `PortalPlugin` | `sp_portal` — portal definitions |
| `PagePlugin` | `sp_page` — portal pages |
| `ThemePlugin` | `sp_theme` — portal themes |
| `MenuPlugin` | `sp_rectangle_menu_item` — portal menus |

### UX Framework / Next Experience Plugins

| Export | What it handles |
|---|---|
| `ApplicabilityPlugin` | `sys_ux_applicability` — UX component applicability |
| `UxListMenuConfigPlugin` | `sys_ux_list_menu_config` — UX list menu configs |
| `WorkspacePlugin` | `sys_ux_page_registry` + app config — Workspace definitions |

### Quality and Compliance Plugins

| Export | What it handles |
|---|---|
| `InstanceScanPlugin` | `scan_*` tables — Instance Scan lint checks |
| `ClaimsPlugin` | `sys_claim` — record ownership claims |

### Test and Dashboard Plugins

| Export | What it handles |
|---|---|
| `TestPlugin` | `sys_atf_test` — Automated Test Framework test definitions |
| `StepConfigs` | ATF step configuration types |
| `DashboardPlugin` | `par_dashboard` + canvas/tab/widget — dashboard definitions |

### Service Catalog Plugins

| Export | what it handles |
|---|---|
| (from `'./service-catalog'`) | `sc_cat_item`, `sc_cat_item_producer`, `catalog_script_client`, `catalog_ui_policy` |

### Utilities

| Export | Purpose |
|---|---|
| `REPACK_OUTPUT_DIR` | Constant for the repack output directory |
| `checkModuleExists(module)` | Checks if a node module is resolvable |
| `resolveModule(module)` | Resolves a module to its file path |

---

## `RecordPlugin` and `TableOwnership`

`RecordPlugin` is the **generic fallback plugin** — it handles any record type not claimed by a more specific plugin. The `TableOwnership` registry maps ServiceNow table names to their owning plugin sys_ids:

```ts
export const TableOwnership: {
  contract_sla: string           // → SlaPlugin
  sys_security_acl: string       // → AclPlugin
  sys_script: string             // → BusinessRulePlugin
  sys_script_client: string      // → ClientScriptPlugin
  sys_script_include: string     // → ScriptIncludePlugin
  sys_user_role: string          // → RolePlugin
  sys_db_object: string          // → TablePlugin
  sys_hub_flow: string           // → FlowDefinitionPlugin
  sys_hub_action_type_definition: string  // → FlowActionDefinitionPlugin
  sp_widget: string              // → WidgetPlugin
  sp_portal: string              // → PortalPlugin
  sys_ws_definition: string      // → RestApiPlugin
  sys_atf_test: string           // → TestPlugin
  sn_aia_agent: string           // → AI Agent plugin (NowAssist)
  sn_nowassist_skill_config: string
  sys_ux_page_registry: string   // → WorkspacePlugin
  par_dashboard: string          // → DashboardPlugin
  // ... 80+ more table mappings
}
```

This registry allows the compiler to route each metadata record to the correct plugin without hardcoding logic.

---

## `BusinessRulePlugin` Detail

```ts
export declare const BusinessRulePlugin: Plugin
export declare const DEFAULT_SCRIPT: string
// = "(function executeRule(current, previous /*null when async*/) {\n\n\t// Add your code here\n\n})(current, previous);"
```

The `DEFAULT_SCRIPT` constant is what gets scaffolded when you create a new Business Rule. The plugin validates that Business Rule scripts conform to the expected IIFE pattern and that `current`/`previous` are used correctly.

---

## `AclPlugin` — Most Parameterized Plugin

```ts
// AclPlugin processes objects with these fields:
{
  $id: string               // Now.ID["value"] — stable reference
  operation: string         // 'read' | 'write' | 'create' | 'delete' | 'execute'
  active?: boolean
  adminOverrides?: boolean
  condition?: string        // encoded query condition
  decisionType?: string     // 'allow' | 'deny'
  description?: string
  localOrExisting?: 'Local' | 'Existing'
  roles?: string[]          // Role sys_ids
  script?: string           // tagged template: script`...`
  securityAttribute?: string
}
```

---

## Toolchain Dependencies

| Dependency | Version | Role |
|---|---|---|
| `@servicenow/sdk-build-core` | 4.5.0 | `Plugin`, `Context`, `FileSystem`, `Logger` types |
| `@servicenow/sdk-core` | 4.5.0 | Record schemas, field types, flow types |
| `@servicenow/glide` | 27.0.5 | TypeScript declarations for server-side type checking |
| `eslint` | 9.39.4 | JavaScript linting for script fields |
| `@eslint-community/eslint-utils` | 4.9.1 | ESLint rule utilities |
| `globals` | 17.3.0 | Global variable sets for eslint config |
| `fast-xml-parser` | 5.3.7 | Parse incoming ServiceNow XML unload files |
| `xmlbuilder2` | 3.1.1 | Construct outgoing XML artifact files |
| `xml-js` | 1.6.11 | XML ↔ JSON conversion utilities |
| `@cyclonedx/cyclonedx-library` | 8.6.0 | SBOM (Software Bill of Materials) generation |
| `packageurl-js` | 2.0.1 | PURL format for SBOM component identifiers |
| `zod` | 3.23.8 | Runtime schema validation of metadata files |
| `lodash` | 4.17.23 | Utilities |
| `mime-types` | 2.1.35 | MIME type detection for static content files |
| `md5.js` | 1.3.5 | Checksums for change detection |
| `libxmljs2` | 0.37.0 | Optional: native XML parsing (falls back to fast-xml-parser) |

---

## How Plugins Work in the Build Pipeline

```
snc build
  → sdk-api Orchestrator.build()
      → sdk-build-core Compiler
          → loads plugin registry
          → scans source directory for metadata files

          For each metadata file:
            1. Identify record type (table name)
            2. Look up owning plugin via TableOwnership
            3. Call plugin.run(context)
               ├── parse source (XML or TypeScript DSL)
               ├── validate against sdk-core schemas
               ├── run ESLint on script fields (via eslint plugin)
               ├── resolve Now.ID / Now.Ref references (Keys registry)
               ├── emit validated XML to appOutDir
               └── report diagnostics (errors/warnings)

          → build SBOM via CycloneDX (if enabled)
          → write all output files
          → save keys registry
      ← BuildResult { success, files, packOutput }
```

---

## SBOM Generation

The presence of `@cyclonedx/cyclonedx-library` and `packageurl-js` indicates the build can emit a **CycloneDX Software Bill of Materials** alongside the app artifacts. This is increasingly required for enterprise and government deployments that need component-level transparency in their ServiceNow apps.

---

## Architecture Summary

```
@servicenow/sdk-build-plugins
│
├── Core record plugins         (ACL, BusinessRule, ScriptInclude, Record, Table, Column, Role, ...)
├── Script validation plugins   (BasicSyntax, ArrowFunction, CallExpression, ClientScript, ...)
├── Flow Designer plugins       (FlowDefinition, Action, Step, Trigger, FlowLogic, ...)
├── UI plugins                  (UIPage, UIAction, UIPolicy, HtmlImport, Static, JSON, ...)
├── Service Portal plugins      (Widget, Portal, Page, Theme, Menu, AngularProvider, ...)
├── UX/Workspace plugins        (Applicability, ListMenuConfig, Workspace, Dashboard, ...)
├── Integration plugins         (RestAPI, ScriptAction, Schedule, EmailNotification, ...)
├── Service Catalog plugins     (CatalogItem, CatalogScript, CatalogUIPolicy, ...)
├── Quality plugins             (InstanceScan, Claims, ATF/Test, ...)
└── Utilities                   (repack, FlowLogicValueProcessor, FLOW_LOGIC constants)
```

---

## Source References

- `docs/npm-packs/extract/servicenow-sdk-build-plugins-4.5.0/package/dist/`
- `docs/npm-packs/extract/servicenow-sdk-build-plugins-4.5.0/package/dist/index.d.ts`
- `https://www.npmjs.com/package/@servicenow/sdk-build-plugins`
