# Deep Dive: `@servicenow/glide` (v27.0.5)

## The Core Insight: Schema Without a Body

`@servicenow/glide` is purely a **TypeScript declaration package**. It ships **zero executable JavaScript**. Every `.js` file in the package follows the same pattern:

```js
// src/sn_fd/index.js  (actual file content)
function noop(){}
```

That is the entire runtime implementation. A single `noop` function that does nothing.

The `.d.ts` declaration files alongside them tell TypeScript (and your editor) everything about the class shape, method signatures, and return types — but the actual logic behind every method lives in the ServiceNow platform's Java/Rhino engine, not in this npm package.

**Why is this valuable?**

When you write a Business Rule or Script Include on ServiceNow, the server engine provides real implementations of `GlideRecord`, `FlowAPI`, `GlideOAuthClient`, etc. The npm package lets your local IDE understand those APIs at edit time — type checking, autocompletion, parameter hints — without needing to ship the actual platform runtime.

---

## Package Identity

| Field | Value |
|---|---|
| Name | `@servicenow/glide` |
| Version | `27.0.5` |
| Description | `Contains type declaration for Glide Scriptable APIs` |
| Types entry | `./src/index.d.ts` |
| Runtime JS | **None** (all `.js` files are `function noop(){}`) |
| Runtime dependencies | **0** |
| Dev tools | `ts-morph`, `ctix`, `typescript 5.9.3`, `tsx`, `jest` |
| Namespace count | **192** `sn_*` modules |
| Node.js required | `>= 20.18.0` |

---

## How the noop Pattern Works

```
@servicenow/glide/src/sn_fd/
├── Flow.d.ts          ← TypeScript: declares class with real signatures
├── Flow.js            ← JavaScript: function noop(){}
├── FlowAPI.d.ts       ← TypeScript: 30+ static methods declared
├── FlowAPI.js         ← JavaScript: function noop(){}
├── index.d.ts         ← re-exports all .d.ts from this namespace
└── index.js           ← function noop(){}
```

When TypeScript resolves `import { FlowAPI } from '@servicenow/glide/sn_fd'`, it reads `FlowAPI.d.ts` and understands the class shape. At runtime on the ServiceNow server, the actual `FlowAPI` Java class is injected by the Rhino scripting engine — the npm `.js` is never executed.

When `@servicenow/sdk-build-plugins` runs its TypeScript compiler during `snc build`, it uses these declarations to type-check your script code. Type errors in your Business Rules or Script Includes are caught at build time via these declaration files.

---

## Exports Map

```json
{
  "exports": {
    ".":    "./src/types/index.js",
    "./*":  "./src/*/index.js",
    "./util": "./src/util/index.js"
  },
  "types": "./src/index.d.ts"
}
```

- `"."` → The root `index.d.ts` re-exports **all 192 namespaces**
- `"./*"` → Individual namespaces are accessible as `@servicenow/glide/sn_fd`, `@servicenow/glide/sn_auth`, etc.
- `"./util"` → Build-time utilities for generating and processing type definitions (excluded from published `files` to keep the package lean)

---

## The `imports/` Base Classes

All Glide scriptable classes trace back to two base types in `src/imports/`:

```ts
// src/imports/AGlideObject.d.ts
export declare class AGlideObject {}

// src/imports/Scriptable.d.ts
export declare class Scriptable {}
```

These are ambient anchors. ServiceNow's Rhino engine injects implementations of these base Java types. Your script classes extend from them. For example:

```ts
// src/sn_fd/Flow.d.ts
import { Context } from "../imports/Context";
import { Scriptable } from "../imports/Scriptable";

export declare class Flow {
  constructor(cx?: Context, args?: any[], ctorObj?: Function, inNewExpr?: boolean);
  static startAsync(scopedFlowName?: string, scriptInputs?: Scriptable): PlanResponse;
}
```

The `Context` and `Function` imports model the Rhino JavaScript engine's internal execution context — they exist only as empty type stubs.

---

## Key Namespace Reference (selected from 192)

| Namespace | Package path | What it types |
|---|---|---|
| `sn_fd` | `@servicenow/glide/sn_fd` | Flow Designer: `Flow`, `FlowAPI`, `FlowRunner`, `Subflow`, `GlideActionUtil` |
| `sn_auth` | `@servicenow/glide/sn_auth` | OAuth: `GlideOAuthClient`, `GlideJWTAPI`, `GlideTokenAuthClient`, `SCIM2Client` |
| `sn_cmdb` | `@servicenow/glide/sn_cmdb` | CMDB: `IdentificationEngine`, `CMDBAttachmentUtil`, `DynamicIREScriptableAPI` |
| `sn_cs` | `@servicenow/glide/sn_cs` | Virtual Agent: `VAActionsObject`, `VAContextObject`, `VAFeedbackObject` |
| `sn_atf` | `@servicenow/glide/sn_atf` | Automated Test Framework: `AutomatedTestingFramework`, `Step`, `StepResult` |
| `sn_sc` | `@servicenow/glide/sn_sc` | Service Catalog: catalog item scripting APIs |
| `sn_ws` | `@servicenow/glide/sn_ws` | Web Services: REST API scripting types |
| `sn_ml` | `@servicenow/glide/sn_ml` | Machine Learning prediction APIs |
| `sn_notification` | `@servicenow/glide/sn_notification` | Notification APIs |
| `sn_security_upgrade_utils` | `@servicenow/glide/sn_security_upgrade_utils` | Security management utilities |
| `sn_ais` | `@servicenow/glide/sn_ais` | AI Search: `AisEvaluationService`, `RelevancyService`, `Synchronizer` |
| `sn_update_set` | `@servicenow/glide/sn_update_set` | Update Set management APIs |
| `sn_vcs` | `@servicenow/glide/sn_vcs` | Version Control (Source Control) APIs |
| `sn_graphql` | `@servicenow/glide/sn_graphql` | GraphQL scripted APIs |
| `sn_flow` | `@servicenow/glide/sn_flow` | Flow scripting primitives |
| `types` | (root) | Core `GlideRecord`, `GlideElement`, `GlideDateTime`, etc. |

---

## FlowAPI: A Detailed Look at Declaration vs Implementation

The `FlowAPI` class in `sn_fd/FlowAPI.d.ts` declares **30+ static methods**:

```ts
export declare class FlowAPI {
  // Execute synchronously (blocks until complete)
  static executeFlow(scopedFlowName?: string, scriptInputs?: Scriptable, timeoutMs?: number): void;
  static executeAction(scopedActionName?: string, scriptInputs?: Scriptable, timeoutMs?: number): Record<any, any>;
  static executeSubflow(scopedSubflowName?: string, scriptInputs?: Scriptable, timeoutMs?: number): Record<any, any>;

  // Start asynchronously (returns immediately with context ID)
  static startFlow(scopedFlowName?: string, scriptInputs?: Scriptable): string;
  static startAction(scopedActionName?: string, scriptInputs?: Scriptable): string;
  static startSubflow(scopedSubflowName?: string, scriptInputs?: Scriptable): string;

  // "Quick" variants — fire and forget
  static executeFlowQuick(scopedFlowName?: string, scriptInputs?: Scriptable, timeoutMs?: number): void;
  static startFlowQuick(scopedFlowName?: string, scriptInputs?: Scriptable): void;

  // State and status inspection
  static getState(contextId?: string): string;
  static getStatus(contextId?: string): Record<any, any>;
  static getOutputs(contextId?: string): Record<any, any>;
  static getErrorMessage(contextId?: string): string;
  static getFlowStages(scopedFlowName?: string): string;
  static getRunningFlows(sourceRecord?: GlideRecord, queryChildContexts?: boolean, flowName?: string): GlideRecord;

  // Control
  static cancel(contextId?: string, reason?: string): void;
  static scheduleCancel(contextId?: string, reason?: string, delaySeconds?: number): void;
  static nudgeFlow(flowContextSysID?: string, delaySeconds?: number): boolean;
  static nudgeFlowsWaitingOn(waitingOnRecordTable?: string, waitingOnRecordSysID?: string, delaySeconds?: number): void;

  // Data streams (for large output flows)
  static executeDataStreamAction(scopedActionName?: string, scriptInputs?: Scriptable, timeoutMs?: number): ScriptableDataStream;

  // Approval helpers
  static eSignatureAudit(approverId?: string, approvalRecord?: any): boolean;
  static hasApprovals(scopedFlowName?: string): string;
  static notifyApprovalAction(o?: any): boolean;

  // Compilation and deployment
  static compile(flowSysId?: string): string;
  static publish(flowSysId?: string): string;

  // Messaging
  static sendMessage(contextSysId?: string, message?: string, payload?: string): void;
}
```

**At runtime**, none of this comes from the npm package. The ServiceNow server provides the actual Java implementation behind every one of these static methods. The declarations are a **contract** between the SDK toolchain and the server.

---

## GlideOAuthClient: Auth Declaration Example

```ts
// src/sn_auth/GlideOAuthClient.d.ts
export declare class GlideOAuthClient {
  getToken(requestor?: string, provideProfileId?: string): GlideOAuthToken;
  requestToken(clientName?: string, jsonString?: string): GlideOAuthClientResponse;
  requestTokenByRequest(clientName?: string, request?: GlideOAuthClientRequest): GlideOAuthClientResponse;
  revokeToken(clientName?: string, accessToken?: string, refreshToken?: string, req?: GlideOAuthClientRequest): GlideOAuthClientResponse;
  revokeTokensForUser(userId?: string): void;
  validateAuthorizationResponse(authResp?: Record<any, any>): boolean;
  getAuthorizationURL(authReq?: Record<any, any>): string;
  initAuthzReqParams(requestorContext?: string, requestorId?: string, oauthEntityProfileId?: string): GlideOAuthStringMap;
}
```

`GlideOAuthClient.js` → `function noop(){}`. The actual OAuth token exchange happens inside the ServiceNow platform's Java runtime.

---

## How @servicenow/sdk-build-plugins Uses Glide Declarations

`@servicenow/sdk-build-plugins` lists `@servicenow/glide` as a **runtime dependency** (not devDependency). This means when the SDK compiler runs your project's TypeScript:

```
Build pipeline:
  snc build
    → sdk-cli parses command
    → sdk-api Orchestrator.build()
    → sdk-build-plugins TypeScript compiler
        → loads @servicenow/glide declarations
        → type-checks your Business Rule scripts
        → catches FlowAPI.startFlow("wrong-name") type errors at build time
    → emits validated XML artifacts
```

Your Business Rule script might reference `FlowAPI.startFlow('my_app.MyFlow', inputs)`. The TypeScript compiler uses `FlowAPI.d.ts` to verify that `startFlow` accepts `(string, Scriptable)` and returns `string`. If your code passes a number or omits required arguments, the build fails before the code ever reaches the platform.

---

## The Version Gap (27.0.5 vs SDK 4.5.0)

The major version `27` reflects the **ServiceNow platform version cadence** (Washington, Xanadu, Yokohama…), not the SDK version. A single SDK version (`4.5.0`) pins a specific platform type surface (`27.0.5`). When ServiceNow adds new APIs on the server, a new glide version ships with updated declarations.

This independent versioning means you can be precise: `@servicenow/glide@27.0.5` = the type surface for a specific platform generation, regardless of what the SDK umbrella version says.

---

## Dev Toolchain in the Package

The package's `devDependencies` reveal how the declarations are **generated**, not hand-written:

| Tool | Purpose |
|---|---|
| `ts-morph` | Programmatic TypeScript AST manipulation — used to generate/transform `.d.ts` files from platform introspection |
| `ctix` | Creates barrel `index.ts` files across the `src/` tree automatically |
| `typescript 5.9.3` | Runs `tsc` to validate all declaration files compile correctly |
| `tsx` | Runs the `exports.ts` prebuild script that wires up the exports map |
| `jest` | Validates declaration correctness with type tests |

The `prebuild` script (`tsx ./exports.ts`) generates the package's exports map dynamically, so adding a new namespace doesn't require manual `package.json` edits.

---

## Architecture Summary

```text
@servicenow/glide (27.0.5)
│
├── src/index.d.ts               ← master re-export of all 192 sn_* namespaces
├── src/imports/                 ← base Rhino types (AGlideObject, Scriptable, Context, ...)
├── src/types/                   ← core Glide types (GlideRecord, GlideElement, GlideDateTime, ...)
│
├── src/sn_fd/                   ← Flow Designer APIs
│   ├── Flow.d.ts / Flow.js      ← declaration + noop
│   ├── FlowAPI.d.ts / FlowAPI.js
│   └── ... (6 more classes)
│
├── src/sn_auth/                 ← OAuth / JWT / Token APIs
│   └── ... (GlideOAuthClient, GlideJWTAPI, SCIM2Client, ...)
│
├── src/sn_cmdb/                 ← CMDB APIs
├── src/sn_cs/                   ← Virtual Agent/Conversational APIs
├── src/sn_atf/                  ← Automated Test Framework
├── src/sn_ais/                  ← AI Search
├── ... (183 more sn_* namespaces)
│
└── src/util/                    ← Build utilities (excluded from published files)
```

---

## Practical Summary

| Question | Answer |
|---|---|
| **Does glide run any code on your machine?** | No. Every `.js` is `function noop(){}` |
| **Where do the actual implementations live?** | ServiceNow platform's Java/Rhino engine |
| **Why install it at all?** | Editor IntelliSense, build-time type checking via sdk-build-plugins |
| **Why does it have 192 namespaces?** | One per ServiceNow plugin scope — covers the full platform API surface |
| **Why version 27 if SDK is version 4?** | Different cadence: 27 = platform generation, 4.5.0 = SDK toolchain version |
| **How do new platform APIs get added?** | `ts-morph` generates new `.d.ts` files from platform introspection; new glide version ships |

---

## Source References

- `docs/npm-packs/extract/servicenow-glide-27.0.5/package/`
- `https://www.npmjs.com/package/@servicenow/glide`
