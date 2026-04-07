import glide from './npm-knowledge/glide.md?raw'

export default function Ch16({ CodeBlock, Callout }) {
  return (
    <div className="space-y-8">
      <Section title="The Core Insight: Schema Without a Body">
        <p>
          <code>@servicenow/glide</code> is a <strong>TypeScript declaration package with zero
          runtime JavaScript</strong>. Every <code>.js</code> file in the package follows exactly
          this pattern:
        </p>
        <CodeBlock
          language="javascript"
          filename="src/sn_fd/index.js (actual file)"
          showLineNumbers={false}
          code={`function noop(){}`}
        />
        <p>
          That is the entire runtime implementation. The <code>.d.ts</code> declaration files
          tell TypeScript — and your editor — everything about class shapes, method signatures,
          and return types. The actual logic behind every method lives in the ServiceNow
          platform's Java/Rhino engine, not in this npm package.
        </p>
        <Callout type="info" title="Why is this valuable?">
          When you write a Business Rule or Script Include on ServiceNow, the server engine provides
          real Java implementations of <code>GlideRecord</code>, <code>FlowAPI</code>,
          <code>GlideOAuthClient</code>, etc. This npm package lets your local IDE understand those
          APIs at edit time — type checking, autocompletion, parameter hints — without shipping the
          actual platform runtime.
        </Callout>
      </Section>

      <Section title="noop Pattern: Declaration vs Implementation">
        <CodeBlock
          language="text"
          filename="src/sn_fd/ structure"
          showLineNumbers={false}
          code={`src/sn_fd/
├── Flow.d.ts       ← TypeScript: declares class with real constructor + static methods
├── Flow.js         ← JavaScript: function noop(){}
├── FlowAPI.d.ts    ← TypeScript: 30+ static methods declared
├── FlowAPI.js      ← JavaScript: function noop(){}
├── index.d.ts      ← re-exports all .d.ts from this namespace
└── index.js        ← function noop(){}`}
        />
        <CodeBlock
          language="typescript"
          filename="src/sn_fd/Flow.d.ts (actual declaration)"
          showLineNumbers={false}
          code={`import { Context } from "../imports/Context";
import { Scriptable } from "../imports/Scriptable";
import { PlanResponse } from "./PlanResponse";

export declare class Flow {
  constructor(cx?: Context, args?: any[], ctorObj?: Function, inNewExpr?: boolean);
  static startAsync(scopedFlowName?: string, scriptInputs?: Scriptable): PlanResponse;
}`}
        />
        <p>
          TypeScript reads <code>Flow.d.ts</code> and understands the class shape. At runtime on
          the ServiceNow server, the actual <code>Flow</code> Java class is injected by the Rhino
          scripting engine — the npm <code>.js</code> is never executed.
        </p>
      </Section>

      <Section title="FlowAPI — 30+ Static Methods Declared">
        <CodeBlock
          language="typescript"
          filename="src/sn_fd/FlowAPI.d.ts (key methods)"
          showLineNumbers={false}
          code={`export declare class FlowAPI {
  // Execute synchronously
  static executeFlow(scopedFlowName?: string, scriptInputs?: Scriptable, timeoutMs?: number): void
  static executeAction(scopedActionName?: string, scriptInputs?: Scriptable, timeoutMs?: number): Record<any, any>
  static executeSubflow(scopedSubflowName?: string, scriptInputs?: Scriptable, timeoutMs?: number): Record<any, any>

  // Start asynchronously (returns context ID immediately)
  static startFlow(scopedFlowName?: string, scriptInputs?: Scriptable): string
  static startAction(scopedActionName?: string, scriptInputs?: Scriptable): string
  static startSubflow(scopedSubflowName?: string, scriptInputs?: Scriptable): string

  // "Quick" variants — fire and forget
  static executeFlowQuick(scopedFlowName?: string, scriptInputs?: Scriptable, timeoutMs?: number): void
  static startFlowQuick(scopedFlowName?: string, scriptInputs?: Scriptable): void

  // State inspection
  static getState(contextId?: string): string
  static getStatus(contextId?: string): Record<any, any>
  static getOutputs(contextId?: string): Record<any, any>
  static getErrorMessage(contextId?: string): string
  static getRunningFlows(sourceRecord?: GlideRecord, queryChildContexts?: boolean, flowName?: string): GlideRecord

  // Control
  static cancel(contextId?: string, reason?: string): void
  static nudgeFlow(flowContextSysID?: string, delaySeconds?: number): boolean

  // Data streams (large output)
  static executeDataStreamAction(scopedActionName?: string, scriptInputs?: Scriptable, timeoutMs?: number): ScriptableDataStream

  // Compile and publish (admin use)
  static compile(flowSysId?: string): string
  static publish(flowSysId?: string): string

  // Approval helpers
  static hasApprovals(scopedFlowName?: string): string
  static notifyApprovalAction(o?: any): boolean
  static eSignatureAudit(approverId?: string, approvalRecord?: any): boolean
}`}
        />
      </Section>

      <Section title="All 192 Namespaces (sn_* modules)">
        <CodeBlock
          language="text"
          filename="src/ namespace listing"
          showLineNumbers={false}
          code={`sn_actsub     → Activation/subscription cache
sn_ais        → AI Search: AisEvaluationService, RelevancyService, Synchronizer
sn_ais_ec     → AI Search External Content ingestion
sn_ale_queue  → App lifecycle operation queues
sn_app_analytics → SNAnalytics, QueryServiceHTTPClient
sn_app_api    → App Store API (ISVDefinition, ValidateDefinition)
sn_atf        → Automated Test Framework: AutomatedTestingFramework, Step, StepResult
sn_auth       → OAuth: GlideOAuthClient, GlideJWTAPI, GlideTokenAuthClient, SCIM2Client
sn_automation → Automation scripting
sn_bc         → Business Continuity
sn_cmdb       → CMDB: IdentificationEngine, CMDBAttachmentUtil, DynamicIREScriptableAPI
sn_cs         → Virtual Agent: VAActionsObject, VAContextObject, VAFeedbackObject
sn_cs_genai   → GenAI Conversational API
sn_data_gen   → Data generation utilities
sn_db         → Database scriptable APIs
sn_delegation → Delegation APIs
sn_discovery  → ITOM Discovery APIs
sn_eval       → Script evaluation APIs
sn_fd         → Flow Designer: Flow, FlowAPI, FlowRunner, Subflow, GlideActionUtil
sn_flow       → Flow scripting primitives
sn_gcf_ns     → Glide Config Framework
sn_graphql    → GraphQL scripted APIs
sn_hermes     → Hermes event processing
sn_i18n       → Internationalization APIs
sn_identity   → Identity management
sn_instance_scan → Instance Scan scriptable APIs
sn_km_intg_api → Knowledge Management integration
sn_lef        → Lifecycle Events Framework
sn_log        → Logging APIs
sn_ml         → Machine Learning prediction APIs
sn_mobile     → Mobile scripting APIs
sn_nlq        → Natural Language Query
sn_nlu        → Natural Language Understanding
sn_notification → Notification APIs
sn_notify     → SMS/messaging notifications
sn_num_generator → Auto-number generation
sn_oneapi     → Now Platform OneAPI
sn_pad        → Platform Analytics Dashboard
sn_par_intelligence → Process Automation + AI
sn_playbook   → Playbook scripting APIs
sn_pwdreset_api → Password Reset APIs
sn_releaseops_apis → Release Operations
sn_sc         → Service Catalog scripting
sn_scoped_cache → Scoped application cache
sn_scripted_gql → Scripted GraphQL APIs
sn_scripted_screen → Scripted Screen APIs
sn_search     → Search APIs
sn_secrets_ns → Secrets Management
sn_sir_core   → Security Incident Response
sn_sm         → Service Management
sn_sp_analytics → Service Portal Analytics
sn_state_flow → State flow scripting
sn_t2s        → Text-to-Speech
sn_telemetry  → Telemetry and monitoring
sn_tours      → Guided Tours
sn_ua         → UI Actions scripting
sn_update_set → Update Set management
sn_usr        → User management
sn_ux_metrics → UX Metrics
sn_vcs        → Version Control (Source Control)
sn_vtb        → Visual Task Boards
sn_vul_core   → Vulnerability Management
sn_word_doc_api → Word document generation
sn_ws         → Web Services (REST API) scripting
sn_zta        → Zero Trust Architecture
types         → Core: GlideRecord, GlideElement, GlideDateTime, ...
... (and 130+ more sn_* namespaces)`}
        />
      </Section>

      <Section title="Base Classes: How Rhino Types Are Anchored">
        <CodeBlock
          language="typescript"
          filename="src/imports/ base types"
          showLineNumbers={false}
          code={`// AGlideObject.d.ts — base for all Glide scriptable objects
export declare class AGlideObject {}

// Scriptable.d.ts — base for objects passed as script inputs
export declare class Scriptable {}

// Context.d.ts — Rhino JavaScript engine execution context
export declare class Context {}

// Function.d.ts — Rhino Function object type
export declare class Function {}`}
        />
        <p>
          These are empty stubs. The ServiceNow Rhino engine provides the actual Java
          implementations at runtime. Your TypeScript code extends from these types and
          gets proper IntelliSense, but the inheritance hierarchy only matters for the type
          checker — not for runtime behavior.
        </p>
      </Section>

      <Section title="How sdk-build-plugins Uses Glide">
        <CodeBlock
          language="text"
          filename="type checking flow"
          showLineNumbers={false}
          code={`snc build
  → Orchestrator.build()
  → sdk-build-plugins TypeScript compiler
      → loads @servicenow/glide declarations as ambient types
      → your Business Rule: FlowAPI.startFlow('my_app.MyFlow', inputs)
          → FlowAPI.d.ts: startFlow(scopedFlowName?: string, scriptInputs?: Scriptable): string
          → TypeScript: ✓ types match
      → your Business Rule: FlowAPI.startFlow(12345)
          → TypeScript: ✗ ERROR — Argument of type 'number' is not assignable to 'string'
  → build fails with diagnostic error before code reaches the platform`}
        />
        <Callout type="tip" title="Type errors caught at build time">
          Because <code>sdk-build-plugins</code> lists <code>@servicenow/glide</code> as a
          runtime dependency (not devDependency), every build gets type checking against the full
          platform API surface — catching mismatches before deployment.
        </Callout>
      </Section>

      <Section title="Version Gap Explained">
        <CodeBlock
          language="text"
          filename="version semantics"
          showLineNumbers={false}
          code={`@servicenow/glide @ 27.0.5   ← platform API surface for a specific SN platform generation
@servicenow/sdk @ 4.5.0      ← SDK toolchain version

The major version 27 reflects the ServiceNow platform release cadence
(Washington DC, Xanadu, Yokohama, ...). Version 4 is the SDK toolchain's
own versioning. They are independent.

When ServiceNow ships new server-side APIs, ts-morph generates new .d.ts
files from platform introspection, and a new @servicenow/glide version ships.
The SDK pins the specific glide version it was tested against.`}
        />
      </Section>

      <Section title="Full Reference Notes">
        <CodeBlock
          language="markdown"
          filename="npm-knowledge/glide.md"
          showLineNumbers={false}
          code={glide}
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
