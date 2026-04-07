import sdkCore from './npm-knowledge/sdk-core.md?raw'

export default function Ch14({ CodeBlock, Callout }) {
  return (
    <div className="space-y-8">
      <Section title="Overview">
        <p>
          <code>@servicenow/sdk-core</code> is the metadata type system for the ServiceNow SDK.
          It defines TypeScript schemas and models for every ServiceNow artifact that the SDK can
          build, validate, or deploy. At 5.72 MB and 1,635 files, its size reflects platform breadth —
          every record type a scoped application can contain has a schema here.
        </p>
        <Callout type="info" title="Zero runtime dependencies">
          This package has no runtime dependencies at all. It is purely type contracts — consumed by
          the compiler, build plugins, and API layer, but never executing logic itself.
        </Callout>
      </Section>

      <Section title="Export Surface">
        <CodeBlock
          language="json"
          filename="package.json (exports)"
          showLineNumbers={false}
          code={JSON.stringify({
            "./global":    "./dist/global/index.d.ts",
            "./*":         "./src/*/index.ts",
            "./runtime/*": "./dist/*/index.js"
          }, null, 2)}
        />
        <p>Three distinct consumers:</p>
        <CodeBlock
          language="text"
          filename="who uses what"
          showLineNumbers={false}
          code={`./global     → TypeScript editors + IDE plugins: compiled .d.ts types
./*          → SDK build tools importing TypeScript source directly
./runtime/*  → SDK packages at build time: compiled JavaScript helpers`}
        />
      </Section>

      <Section title="Source Directory Structure">
        <CodeBlock
          language="text"
          filename="src/ layout"
          showLineNumbers={false}
          code={`src/
├── app/           → ApplicationMenu, Property, UserPreference,
│                    CrossScopePrivilege, BusinessRule, Acl, Role,
│                    Test, ImportSet, Sla, JsonSerializable
│
├── db/            → Table, Record, Column
│                    Field types: String, Integer, Boolean, Date, Script,
│                    Reference, Choice, List, Guid, Password2, Json,
│                    TranslatedText, Conditions, FieldName, ... (25 types)
│
├── flow/          → Flow, Subflow, Action, Trigger, InlineScript,
│                    dataPill, ApprovalRules, FlowLogic, FlowVariables
│
├── global/        → Now.ID, Now.Keys, Now.Ref, Now.Tables,
│                    script tagged-template, include, image, data-helpers
│
├── service-catalog/ → sc_cat_item, catalog scripts, catalog UI policies
├── service-portal/  → Widget, Portal, Page, Theme, Menu, AngularProvider
├── ui/              → UIPage, UIAction, UIPolicy
├── script/          → Script Include schema
├── clientscript/    → Client Script schema
├── rest/            → REST API descriptor types
├── dashboard/       → Dashboard widget schemas
├── uxf/             → Next Experience UX component schemas
├── instancescan/    → Instance Scan check schemas
├── notification/    → Email notification descriptor types
├── fluent/          → Generated dependency type helpers
└── util/            → Shared type utilities`}
        />
      </Section>

      <Section title="Database Layer — Field Types (src/db/)">
        <CodeBlock
          language="typescript"
          filename="src/db/index.ts"
          showLineNumbers={false}
          code={`export * from './Table'
export * from './Record'
export * from './Column'

// Every ServiceNow field type
export * from './types/String'
export * from './types/Integer'
export * from './types/Boolean'
export * from './types/Date'
export * from './types/Script'        // server-side script field
export * from './types/Reference'     // FK to another table
export * from './types/List'          // list-type field
export * from './types/Choice'        // choice list
export * from './types/Guid'          // sys_id
export * from './types/Password2'     // encrypted password
export * from './types/Json'          // JSON blob
export * from './types/TranslatedText'
export * from './types/Conditions'    // encoded query string
export * from './types/FieldName'
export * from './types/Radio'
// ... 10 more field types`}
        />
      </Section>

      <Section title="Flow Layer — Authoring Schema (src/flow/)">
        <CodeBlock
          language="typescript"
          filename="src/flow/index.ts"
          showLineNumbers={false}
          code={`export * from './Flow'           // FlowDefinition builder
export * from './Subflow'        // SubflowDefinition
export * from './FlowTypes'      // flow data type aliases
export * from './FlowVariables'  // input/output variable descriptors
export * from './transform'      // mapping/transform types
export * from './built-ins'      // built-in step types
export { InlineScript, dataPill, ApprovalRules, ApprovalDueDate }
  from './flow-data-helpers'

export type {
  ArrayFlowDataType, FlowDataType,
  ApprovalRulesType, ApprovalConditionRuleType,
  ApprovalRuleActionType, ApprovalRuleSetType, ApprovalDueDateType
} from './flow-data-helpers'`}
        />
        <p>
          Flow Designer actions written in the TypeScript DSL use these types.
          The <code>sdk-build-plugins</code> flow plugins (<code>flow-definition-plugin</code>,
          <code>flow-action-definition-plugin</code>, etc.) consume these schemas to validate and
          transform your source into platform XML.
        </p>
      </Section>

      <Section title="Global Type Augmentation (src/global/)">
        <CodeBlock
          language="typescript"
          filename="src/global/index.ts"
          showLineNumbers={false}
          code={`export * from './unresolved'       // Now.Unresolved — forward references
export * from './Keys'             // Now.Keys — the keys registry type
export * from './Tables'           // Now.Tables — global table type map
export * from './tagged-templates' // script\`...\`, Now.ID\`...\`
export * from './include'          // Now.Include for Script Include refs
export * from './image'            // Now.Image
export * from './ref'              // Now.Ref — typed record references
export * from './data-helpers'     // data accessors
import './attach'                  // installs global type augmentation`}
        />
        <Callout type="info" title="Side-effect import">
          The <code>import './attach'</code> installs global TypeScript scope augmentations so
          that <code>Now.ID</code>, <code>Now.Ref</code>, and <code>script``</code> tagged templates
          are available in your project files without explicit imports.
        </Callout>
      </Section>

      <Section title="Full Reference Notes">
        <CodeBlock
          language="markdown"
          filename="npm-knowledge/sdk-core.md"
          showLineNumbers={false}
          code={sdkCore}
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
