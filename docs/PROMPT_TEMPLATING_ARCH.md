# Prompt Templating System Architecture

## Overview

The Prompt Templating System has been "reified" from a static/local
implementation into a dynamic, database-backed service. This facilitates the
"Self-Improving Platform" vision by allowing AI agents to analyze, optimize, and
manage prompt templates programmatically.

## Architecture

### 1. Database Layer (PostgreSQL)

The system is backed by the following Prisma models:

- **PromptTemplate**: The core entity representing a specific prompt (e.g.,
  "General Assistant").
- **PromptVersion**: Immutable versions of a template. Stores the actual
  content, variables, and performance metrics.
- **PromptSnippet**: Reusable blocks of text (e.g., "System Role", "Output
  Format").

### 2. Backend API (NestJS)

The `PromptTemplatesModule` in `apps/api` exposes REST endpoints:

- `GET /api/prompt-templates`: List all templates.
- `GET /api/prompt-templates/:id`: Get a specific template with its versions.
- `POST /api/prompt-templates`: Create a new template.
- `POST /api/prompt-templates/:id/versions`: Add a new version (iteration).
- `POST /api/prompt-templates/:id/compile`: variable substitution and
  compilation of the prompt.
- `POST /api/prompt-templates/snippets`: Manage snippet library.

### 3. Frontend Integration (Browser Hub / Electron)

The Electron application (`enhanced-browser-hub.html`) interacts with the system
via `window.electronAPI`.

- **Old Flow**: `electronAPI` -> `ipcRenderer` -> `HybridBackend` ->
  `Python Script` (Limited, isolated).
- **New Flow**: `electronAPI` -> `ipcRenderer` -> `fetch(API_URL)` (Unified,
  DB-backed).

### 4. Self-Improvement Cycle

This architecture enables the following meta-feedback loop:

1.  **Execution**: System runs a prompt (via `compile` and then LLM inference).
2.  **Measurement**: `metrics` (success rate, latency) are recorded on the
    `PromptVersion`.
3.  **Analysis**: An AI agent can query `GET /api/prompt-templates/:id` to
    inspect metrics.
4.  **Optimization**: The Agent generates a new, improved prompt version.
5.  **Deployment**: The Agent calls `POST /api/prompt-templates/:id/versions` to
    deploy the optimization.

## Usage

### Creating a Template

```typescript
const template = await axios.post('/api/prompt-templates', {
  name: 'My New Prompt',
  category: 'Coding',
  versions: [
    {
      version: 1,
      content: 'You are a coding assistant...',
      variables: { language: 'typescript' },
    },
  ],
});
```

### Compiling a Prompt

```typescript
const result = await axios.post(
  `/api/prompt-templates/${template.id}/compile`,
  {
    variables: { language: 'python' },
  }
);
console.log(result.data.content); // "You are a coding assistant..." -> with vars replaced
```
