# Nodebase

**Full-Stack Visual Workflow Automation Platform**

Nodebase is a full-stack, visual workflow automation platform built with Next.js — essentially, "build your own Zapier." Users design workflows as connected graphs, connect triggers to actions, and Nodebase executes those workflows as reliable background jobs. Each node can be monitored in real time, while every workflow run is stored for later inspection.

## Features

- Visual drag-and-drop workflow creation
- Manual and webhook-based workflow triggers
- AI-powered workflow nodes
- HTTP and messaging actions
- Variable and Handlebars-based data passing
- Durable background execution with retries
- Live node execution status
- Complete execution history and error reporting
- Email/password, GitHub, and Google authentication
- Encrypted AI/provider credentials
- Subscription billing and a self-service billing portal
- Built-in monitoring, tracing, logs, and session replay

## What Nodebase Does

### Workflow Builder
Visual drag-and-drop editor for building workflows as node graphs. React Flow powers the workflow canvas. Nodes are connected using handles and directed connections. Each node represents a trigger, action, AI operation, or messaging operation.

### Triggers
Workflows can start from:
- Manual execution
- Google Forms submissions
- Stripe events

### AI Automation
AI nodes can directly call:
- OpenAI
- Anthropic (Claude)
- Gemini

### Actions
- HTTP requests
- Discord messages
- Slack messages

### Data Flow
Data moves between nodes using:
- Runtime context
- Node outputs
- Variables
- Handlebars templates

### Reliable Execution
Workflows run as durable background jobs with:
- Automatic retries
- Execution tracking
- Node-level status updates
- Error capture
- Stack traces
- Complete execution history

## How Nodebase Works

The workflow lifecycle:

1. **Build** — The user creates a workflow visually by connecting trigger and action nodes.

   ```
   [Manual Trigger] -> [HTTP Request] -> [OpenAI] -> [Slack Message]
   ```

2. **Trigger** — A workflow starts when one of its triggers fires (manual click, Google Forms submission, or Stripe event).

3. **Create Execution** — Nodebase creates an execution record and marks it as `RUNNING`.

4. **Determine Execution Order** — The workflow graph is analyzed and nodes are topologically sorted so dependencies execute in the correct order.

5. **Execute Nodes** — The executor registry selects the correct executor for each node type. Each node:
   1. Receives the accumulated workflow context
   2. Performs its operation
   3. Produces an output
   4. Adds or updates data in the context
   5. Passes the updated context to the next node

6. **Live Progress** — Execution progress is streamed back to the editor through Inngest Realtime, showing nodes transition through their execution states.

7. **Complete Execution** — A workflow ends with `SUCCESS` or `FAILED`. The execution history stores final output, error information, stack trace, timestamps, and execution status.

## Architecture

```
┌───────────────────────────────────────────────┐
│              PRESENTATION LAYER                │
│      Next.js App Router + React + React Flow   │
└──────────────────────┬────────────────────────┘
                        │
┌──────────────────────▼────────────────────────┐
│              API / DATA LAYER                  │
│   tRPC + TanStack Query + Zod + SuperJSON       │
└──────────────────────┬────────────────────────┘
                        │
┌──────────────────────▼────────────────────────┐
│            AUTHENTICATION LAYER                │
│                 Better Auth                     │
└──────────────────────┬────────────────────────┘
                        │
┌──────────────────────▼────────────────────────┐
│              PERSISTENCE LAYER                  │
│              Prisma + PostgreSQL                │
└──────────────────────┬────────────────────────┘
                        │
┌──────────────────────▼────────────────────────┐
│          WORKFLOW EXECUTION LAYER               │
│                   Inngest                       │
└──────────────────────┬────────────────────────┘
                        │
          ┌─────────────┼─────────────┐
          ▼              ▼             ▼
    AI Providers     Messaging     HTTP/API
    OpenAI            Discord      Requests
    Anthropic         Slack
    Gemini
```

### Presentation Layer
Built with the Next.js App Router.

**Responsibilities:** authentication pages, dashboard, workflow editor, credential management, execution history, workflow visualization.

**Key technologies:** Next.js App Router, React, React Flow, Jotai, shadcn/ui, Base UI.

Jotai manages editor-specific state. A **node component registry** (`config/node-components.ts`) maps each database node type to its corresponding visual React component.

### API & Data Layer
The frontend communicates with the backend through tRPC.

- **tRPC 11** — end-to-end typed API; strong TypeScript typing; no manually maintained API contracts; safer frontend/backend communication.
- **TanStack Query** — server-state caching, mutations, loading/error states, query invalidation.
- **Zod** — validates incoming API inputs.
- **SuperJSON** — safely serializes values such as `Date` objects across the network.

Protected routes verify the user's Better Auth session, ensuring users can only access their own workflows, credentials, executions, and related resources.

### Authentication Layer
Powered by **Better Auth**.

- Email and password
- GitHub OAuth
- Google OAuth

Email/password registration automatically signs the user in after registration.

Auth handler: `/api/auth/[...all]`

### Persistence Layer
**Prisma 7 + PostgreSQL (Neon)**

Core database models:

| Model | Description |
|---|---|
| **User** | The account owner. Owns workflows and credentials. |
| **Workflow** | Stores workflow metadata and ownership information. |
| **Node** | An individual workflow node — type, position, configuration. |
| **Connection** | A directed connection between two node handles. |
| **Credential** | A user's encrypted provider credentials. |
| **Execution** | Info about a workflow run — status, timestamps, output, errors. |

### Workflow Execution Engine
Asynchronous and event-driven, powered by **Inngest**.

- **Event:** `workflows/execute.workflow`
- **Inngest endpoint:** `/api/inngest`

**Execution flow:**
1. Trigger fires
2. Event is sent to Inngest
3. Execution record is created
4. Execution status becomes `RUNNING`
5. Nodes are topologically sorted
6. Executor registry selects each executor
7. Nodes execute sequentially according to dependencies
8. Context is passed from node to node
9. Progress is streamed through Inngest Realtime
10. Execution ends with `SUCCESS` or `FAILED`

**Retries:** Production runs automatically retry up to three times. Malformed events fail immediately and are not retried.

### Trigger Layer
- **Manual** — started from the authenticated workflow editor.
- **Google Forms** — Google Apps Script sends submissions to `/api/webhooks/google-form`.
- **Stripe** — Stripe sends events to `/api/webhooks/stripe`.

Data received by a trigger becomes the initial context available to later nodes.

### Credentials & Encryption
Users can store their own provider credentials for OpenAI, Anthropic, and Gemini.

- **Encryption:** Values are encrypted using Cryptr + `ENCRYPTION_KEY` before being stored in the database.
- **Decryption:** Credentials are decrypted only in memory when a node needs them.

> **Important:** The `ENCRYPTION_KEY` is critical. If the key is lost, previously stored credentials become permanently unreadable. Never commit encryption keys or other secrets to source control.

### Billing
Handled by **Polar** — subscription checkout, customer records, billing portal. Premium features check the user's subscription status; if access is denied, Nodebase can display an upgrade modal.

### Observability
Powered by **Sentry**, connected to the client runtime, Node.js runtime, and Edge runtime.

Features: error reporting, performance tracing, logs, session replay, source maps.

## Tech Stack

| Category | Technologies |
|---|---|
| Framework | Next.js 16, React 19, TypeScript |
| Styling | Tailwind CSS 4, shadcn/ui, Base UI |
| Workflow Canvas | React Flow, Jotai |
| API | tRPC 11, TanStack Query, Zod, SuperJSON |
| Database | Prisma 7, PostgreSQL, Neon |
| Authentication | Better Auth |
| Background Jobs | Inngest |
| AI | Vercel AI SDK, OpenAI SDK, Anthropic SDK, Google AI SDK |
| Templating | Handlebars |
| Security | Cryptr |
| Billing | Polar |
| Monitoring | Sentry |
| Forms & UX | React Hook Form, nuqs, Sonner |
| Hosting | Vercel |

## Workflow Node Types

- **Trigger Nodes:** Initial, Manual, Google Forms, Stripe
- **Network Nodes:** HTTP Request
- **AI Nodes:** OpenAI, Anthropic, Gemini
- **Messaging Nodes:** Discord, Slack

### Node Architecture
Each node typically contains four major pieces:

1. **Configuration Dialog** — controls the node's settings in the editor
2. **Visual Node Component** — represents the node on the React Flow canvas
3. **Server Action** — handles server-side operations required by the node
4. **Executor** — contains the runtime behavior used when the workflow executes

The **executor registry** is the single source of truth for mapping node types to their runtime behavior. Location: `features/executions/lib/executor-registry.ts`

## Data Flow Between Nodes

Nodebase uses accumulated execution context:

```
Trigger Output
  { name: "Mohamed", orderId: "1234" }
        │
        ▼
HTTP Request
  { status: "paid", amount: 500 }
        │
        ▼
AI Node
  Generated response
        │
        ▼
Slack Message
```

Handlebars templates can reference values from the workflow context, e.g. `{{name}}`, `{{orderId}}`, allowing information produced by one node to be reused by later nodes.

## Repository Structure

```
app/                  Pages, layouts, and API route handlers
components/           Shared application, editor, and UI components
config/               Constants and visual node registry
features/             Domain-specific application features
  auth/                 Authentication interface
  credentials/           Encrypted credential management
  editor/                Workflow canvas and editor state
  executions/            Executors, nodes, and execution history
  subscriptions/         Subscription state
  triggers/              Manual and webhook triggers
  workflows/             Workflow CRUD and list interface
inngest/              Inngest client, functions, channels, and execution helpers
lib/                  Authentication, database, encryption, Polar, utilities
prisma/               Database schema and migrations
public/logos/         Provider assets
trpc/                 Client, server, query cache, application router
```

## Important File Locations

| File | Purpose |
|---|---|
| `prisma/schema.prisma` | Database models and relationships |
| `trpc/routers/_app.ts` | Main tRPC application router |
| `inngest/functions.ts` | Workflow execution functions and orchestration |
| `features/executions/lib/executor-registry.ts` | Maps node types to their runtime executors |
| `config/node-components.ts` | Maps node types to their visual React components |
| `app/api/inngest/route.ts` | Registers the Inngest endpoint with the Next.js application |

## Security Checklist

**Environment Variables**
- [ ] Keep secrets only in environment variables
- [ ] Never commit secrets to Git
- [ ] Protect production environment variables

**Encryption**
- [ ] Back up `ENCRYPTION_KEY` securely
- [ ] Never expose decrypted credentials to the client
- [ ] Never log decrypted API keys

**Stripe**
- [ ] Add Stripe webhook signature verification
- [ ] Reject requests with invalid signatures
- [ ] Validate Stripe event payloads

**Public Webhooks**
- [ ] Verify webhook senders
- [ ] Validate workflow ownership
- [ ] Prevent unauthorized workflow execution
- [ ] Validate incoming payloads

**Sentry / Privacy**
- [ ] Review PII collection
- [ ] Review tracing configuration
- [ ] Review session replay settings
- [ ] Ensure configuration matches the production privacy policy

## Production Readiness

**Authentication**
- [ ] Verify OAuth redirect URLs
- [ ] Verify production auth base URL
- [ ] Test GitHub login
- [ ] Test Google login
- [ ] Test email/password registration and login

**Database**
- [ ] Verify production PostgreSQL connection
- [ ] Run Prisma migrations
- [ ] Verify database indexes and relationships

**Inngest**
- [ ] Configure production Inngest credentials
- [ ] Verify the event key
- [ ] Verify `/api/inngest`
- [ ] Test workflow retries
- [ ] Test failed executions

**Credentials**
- [ ] Configure `ENCRYPTION_KEY`
- [ ] Back up `ENCRYPTION_KEY`
- [ ] Test credential encryption/decryption

**Webhooks**
- [ ] Verify Google Forms webhook
- [ ] Verify Stripe webhook
- [ ] Add Stripe signature verification
- [ ] Validate webhook ownership

**Billing**
- [ ] Configure Polar
- [ ] Test checkout
- [ ] Test subscription status
- [ ] Test billing portal
- [ ] Test premium feature restrictions

**Observability**
- [ ] Configure Sentry
- [ ] Verify source maps
- [ ] Review session replay settings
- [ ] Review PII/privacy settings

## End-to-End Example

```
Google Form
    │
    ▼
HTTP Request
    │
    ▼
Gemini
    │
    ▼
Slack
```

1. A user submits a Google Form.
2. Google Apps Script sends the submission to Nodebase.
3. Nodebase validates the webhook request.
4. A workflow execution is created.
5. The execution status becomes `RUNNING`.
6. The Google Forms data becomes the initial workflow context.
7. The HTTP Request node executes.
8. Its output is added to the context.
9. The Gemini node reads the available context.
10. Gemini generates a response.
11. The Slack node receives the generated output.
12. Slack sends the message.
13. Nodebase marks the execution as `SUCCESS`.
14. The complete execution is stored in execution history.

If any node fails: the error is captured, the stack trace is stored, the execution becomes `FAILED`, production retry rules are applied, and the user can inspect the failed execution afterward.

## Core Design Principles

- **Type Safety** — tRPC + TypeScript + Zod provide strongly typed communication between frontend and backend.
- **Modularity** — Features are separated by domain, making the application easier to maintain and extend.
- **Single Source of Truth** — The executor registry centrally maps node types to their runtime behavior.
- **Security by Default** — Credentials are encrypted and protected by authenticated ownership checks.
- **Durable Execution** — Inngest handles background execution, retries, and reliable workflow processing.
- **Observability** — Every workflow execution can be inspected through status, output, errors, and stack traces.
- **Extensibility** — New workflow nodes can be added by implementing the expected configuration, UI, server action, and executor components.

## Future Hardening Priorities

**High Priority**
1. Verify Stripe webhook signatures.
2. Secure all public webhook routes.
3. Validate workflow ownership before execution.
4. Protect and back up `ENCRYPTION_KEY`.
5. Verify all production OAuth redirect URIs.
6. Secure production Inngest configuration.
7. Review Sentry PII and session replay settings.

**Medium Priority**
1. Add more workflow trigger types.
2. Add more integrations.
3. Improve execution debugging.
4. Add richer execution logs.
5. Add workflow versioning.
6. Add more granular permissions.

**Long-Term**
1. Workflow templates
2. Team collaboration
3. Marketplace for integrations
4. Custom node SDK
5. Advanced scheduling
6. Workflow analytics
7. Multi-step branching and conditions

## Quick Reference

| | |
|---|---|
| **Project** | Nodebase |
| **Purpose** | Visual workflow automation platform |
| **Frontend** | Next.js 16 + React 19 |
| **Backend API** | tRPC 11 |
| **Database** | Prisma 7 + PostgreSQL + Neon |
| **Auth** | Better Auth |
| **Workflow Engine** | Inngest |
| **AI** | OpenAI, Anthropic, Gemini |
| **Messaging** | Discord, Slack |
| **Billing** | Polar |
| **Security** | Cryptr |
| **Observability** | Sentry |
| **Hosting** | Vercel |
| **Primary Execution Event** | `workflows/execute.workflow` |
| **Primary Inngest Route** | `/api/inngest` |
| **Primary Database Schema** | `prisma/schema.prisma` |
| **Primary Executor Registry** | `features/executions/lib/executor-registry.ts` |
| **Primary Node Component Registry** | `config/node-components.ts` |
| **Primary API Router** | `trpc/routers/_app.ts` |
