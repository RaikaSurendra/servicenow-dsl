import sdkBuildPlugins from './npm-knowledge/sdk-build-plugins.md?raw'

export default function Ch15({ CodeBlock, Callout }) {
  return (
    <div className="space-y-8">
      <Section title="Overview">
        <p>
          <code>@servicenow/sdk-build-plugins</code> is the transformation and validation engine for
          the build pipeline. It is a registry of plugins — each plugin knows how to read, validate,
          transform, and emit one or more ServiceNow metadata record types. Every artifact in a scoped
          app passes through a corresponding plugin during <code>snc build</code>.
        </p>
      </Section>

      <Section title="The Plugin Contract">
        <CodeBlock
          language="typescript"
          filename="Plugin interface (from sdk-build-core)"
          showLineNumbers={false}
          code={`// Every plugin implements the Plugin interface
import { Plugin } from '@servicenow/sdk-build-core'

// Example — AclPlugin processes sys_security_acl records
export declare const AclPlugin: Plugin

// Example — BusinessRulePlugin
export declare const BusinessRulePlugin: Plugin
export declare const DEFAULT_SCRIPT: string
// = "(function executeRule(current, previous /*null when async*/) {
//       // Add your code here
//   })(current, previous);"`}
        />
      </Section>

      <Section title="Full Plugin Registry (dist/index.d.ts — all exports)">
        <CodeBlock
          language="text"
          filename="plugin list by category"
          showLineNumbers={false}
          code={`CORE METADATA
  AclPlugin              sys_security_acl — access control rules
  BusinessRulePlugin     sys_script — server-side business rules
  ScriptIncludePlugin    sys_script_include — reusable server libraries
  RecordPlugin           generic fallback for any record type
  TablePlugin            sys_db_object + sys_dictionary
  ColumnPlugin           column-level transforms within tables
  DataPlugin             arbitrary table data records
  RolePlugin             sys_user_role
  PropertyPlugin         sys_properties
  UserPreferencePlugin   sys_user_preference
  ApplicationMenuPlugin  sys_app_application
  ViewPlugin             sys_ui_view
  CrossScopePrivilegePlugin  sys_scope_privilege

SCRIPT + SYNTAX
  ClientScriptPlugin     sys_script_client
  BasicSyntaxPlugin      JavaScript syntax validation
  ArrowFunctionPlugin    arrow function transforms
  CallExpressionPlugin   function call pattern validation
  ServerModulePlugin     server module scripts
  NowIdPlugin            Now.ID tagged template resolution
  NowRefPlugin           Now.Ref typed reference resolution
  NowIncludePlugin       Now.Include (Script Include refs)
  NowUnresolvedPlugin    detects unresolved Now.* references
  NowConfigPlugin        validates now.config.json
  PackageJsonPlugin      validates project package.json

FLOW DESIGNER
  FlowDefinitionPlugin           sys_hub_flow
  FlowActionDefinitionPlugin     sys_hub_action_type_definition
  StepDefinitionPlugin           sys_flow_step_definition
  StepInstancePlugin             sys_hub_step_instance
  FlowInstancePlugin             sys_hub_trigger_instance_v2
  FlowTriggerInstancePlugin      trigger instances
  TriggerPlugin                  trigger record transforms
  WfaDatapillPlugin              data pill resolution
  InlineScriptPlugin             inline scripts in flow actions
  ApprovalRulesPlugin            approval rules
  FlowDiagnosticsPlugin          flow-specific diagnostics
  FlowLogicPlugin                sys_hub_flow_logic_instance_v2
  FlowActivationTask             post-install flow activation
  FlowLogicValueProcessor        branch value processor
  FLOW_LOGIC                     constants for flow logic types

UI + EXPERIENCE
  UiPagePlugin           sys_ui_page — legacy UI pages
  UiActionPlugin         sys_ui_action — buttons, context menu
  UiPolicyPlugin         sys_ui_policy — client-side UI policies
  HtmlImportPlugin       HTML template imports
  StaticContentPlugin    static files (CSS, JS, images)
  JsonPlugin             JSON configuration files
  NowAttachPlugin        Now.Attach file attachment handling

SERVICE PORTAL
  WidgetPlugin           sp_widget
  DependencyPlugin       sp_dependency
  AngularProviderPlugin  sp_angular_provider
  PortalPlugin           sp_portal
  PagePlugin             sp_page
  ThemePlugin            sp_theme
  MenuPlugin             sp_rectangle_menu_item

UX + WORKSPACE
  ApplicabilityPlugin    sys_ux_applicability
  UxListMenuConfigPlugin sys_ux_list_menu_config
  WorkspacePlugin        sys_ux_page_registry + app config

REST + INTEGRATION
  RestApiPlugin          sys_ws_definition + operations
  ScriptActionPlugin     sysevent_script_action
  ScheduleScript         sysauto_script
  EmailNotificationPlugin  sysevent_email_action
  ImportSetsPlugin       sys_transform_map
  SlaPlugin              contract_sla

QUALITY + TESTING
  InstanceScanPlugin     scan_* tables
  ClaimsPlugin           sys_claim
  TestPlugin             sys_atf_test
  StepConfigs            ATF step config types
  DashboardPlugin        par_dashboard + canvas/tab/widget

SERVICE CATALOG
  (from './service-catalog')
  sc_cat_item, sc_cat_item_producer, catalog_script_client, catalog_ui_policy

UTILITIES
  REPACK_OUTPUT_DIR      constant for repack output dir
  checkModuleExists(m)   checks if a node module is resolvable
  resolveModule(m)       resolves module to file path`}
        />
      </Section>

      <Section title="TableOwnership Registry">
        <CodeBlock
          language="typescript"
          filename="dist/record-plugin.d.ts (excerpt)"
          showLineNumbers={false}
          code={`export const TableOwnership: {
  contract_sla: string          // → SlaPlugin
  sys_security_acl: string      // → AclPlugin
  sys_script: string            // → BusinessRulePlugin
  sys_script_client: string     // → ClientScriptPlugin
  sys_script_include: string    // → ScriptIncludePlugin
  sys_user_role: string         // → RolePlugin
  sys_db_object: string         // → TablePlugin
  sys_hub_flow: string          // → FlowDefinitionPlugin
  sys_hub_action_type_definition: string  // → FlowActionDefinitionPlugin
  sp_widget: string             // → WidgetPlugin
  sp_portal: string             // → PortalPlugin
  sys_ws_definition: string     // → RestApiPlugin
  sys_atf_test: string          // → TestPlugin
  sys_ux_page_registry: string  // → WorkspacePlugin
  par_dashboard: string         // → DashboardPlugin
  sn_aia_agent: string          // → AI Agent plugin
  // ... 80+ table → plugin mappings
}`}
        />
        <p>
          This registry routes each metadata record to the correct plugin without hardcoding logic
          in the compiler. Adding new record types means adding new plugin entries here.
        </p>
      </Section>

      <Section title="How Plugins Run in the Build Pipeline">
        <CodeBlock
          language="text"
          filename="build execution"
          showLineNumbers={false}
          code={`snc build → Orchestrator.build() → sdk-build-core Compiler
  → load plugin registry (all exports from dist/index.js)
  → scan source directory for metadata files

  For each metadata file:
    1. identify record type from table name
    2. look up owning plugin via TableOwnership
    3. call plugin.run(context):
       ├── parse source (XML or TypeScript DSL)
       ├── validate against sdk-core schemas (via zod)
       ├── run ESLint on script fields (for code quality)
       ├── resolve Now.ID / Now.Ref references (Keys registry)
       ├── emit validated XML to appOutDir
       └── report diagnostics (errors/warnings)

  → build SBOM via CycloneDX (if enabled)
  → write all output files
  → save keys registry`}
        />
        <Callout type="info" title="ESLint integration">
          Script fields in Business Rules, Script Includes, and Client Scripts are linted
          using <code>eslint@9.39.4</code> during the build. ESLint errors appear as build
          diagnostics — same output stream as TypeScript type errors.
        </Callout>
      </Section>

      <Section title="Key Toolchain Dependencies">
        <CodeBlock
          language="text"
          filename="runtime dependencies"
          showLineNumbers={false}
          code={`@servicenow/glide@27.0.5     → TypeScript declarations for server-side type checking
eslint@9.39.4                → JavaScript linting for script fields
fast-xml-parser@5.3.7        → parse incoming ServiceNow XML unload files
xmlbuilder2@3.1.1            → construct outgoing XML artifact files
xml-js@1.6.11                → XML ↔ JSON conversion utilities
@cyclonedx/cyclonedx-library → SBOM (CycloneDX) generation
packageurl-js@2.0.1          → PURL format for SBOM component identifiers
zod@3.23.8                   → runtime schema validation of metadata files
mime-types@2.1.35            → MIME type detection for static content
md5.js@1.3.5                 → checksums for change detection
libxmljs2@0.37.0 (optional)  → native XML parsing (falls back to fast-xml-parser)`}
        />
      </Section>

      <Section title="Full Reference Notes">
        <CodeBlock
          language="markdown"
          filename="npm-knowledge/sdk-build-plugins.md"
          showLineNumbers={false}
          code={sdkBuildPlugins}
        />
      </Section>
    </div>
  )
}

function Section({ title, children }) {
  return (
    <section>
      <h2 className="text-lg font-semibold mb-3" style={{ color: 'var(--color-text-primary)' }}>{title}</h2>
      <div className="text-sm leading-relaxed space-y-2" style={{ color: 'var(--color-text-muted)' }}>
        {children}
      </div>
    </section>
  )
}
