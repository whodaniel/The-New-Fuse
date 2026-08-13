# Plan: Workflow Builder Module Audit

## Goal

Audit every module in the drag-and-drop workflow builders (modern + legacy +
enhanced), identify missing or partially wired features (UI → backend →
execution), and fix UI layout/overlap issues.

## Audit Checklist (Per Module)

### 1. UI Behavior

- [ ] All controls (selects, inputs, textareas, buttons) are functional and
      responsive.
- [ ] No layout overlaps or crowding at various viewport sizes.
- [ ] Tooltips and help text are present and accurate.
- [ ] Search/filtering works as expected (for Agent and MCP nodes).
- [ ] Correct icons and badges are displayed.

### 2. Persistence (UI Config)

- [ ] Node configuration updates correctly in the ReactFlow state on change.
- [ ] Configuration is correctly mapped to the `config` object in node `data`.
- [ ] Default values are correctly initialized.
- [ ] Loading saved workflows restores all node configurations accurately.

### 3. Backend Wiring (API)

- [ ] `POST /api/workflows` correctly receives and saves the full node/edge
      configuration.
- [ ] External data fetching (Agents, MCP Servers, Workflows) is fully wired to
      live endpoints.
- [ ] Error handling for failed API calls is implemented in the UI (loading
      states, error messages).

### 4. Execution Logic

- [ ] `POST /api/workflows/execute` correctly processes each node type.
- [ ] Logic for complex nodes (Loop, Condition, Transform, Subworkflow) is
      correctly implemented in the backend engine.
- [ ] Output from one node is correctly passed as input to the next.
- [ ] Notification nodes trigger the expected side effects.

### 5. Error Handling & Edge Cases

- [ ] Validation prevents saving/executing invalid configurations (e.g., missing
      required fields).
- [ ] Runtime errors during execution are captured and reported back to the UI.
- [ ] Circular dependencies are detected and prevented.

---

## Module Inventory & Status

| Module                | UI Status  | Persistence Status | Execution Status | Notes                                                |
| :-------------------- | :--------- | :----------------- | :--------------- | :--------------------------------------------------- |
| **Agent Node**        | 🟡 Pending | 🟡 Pending         | 🟡 Pending       | Check grouped select and capability badges.          |
| **MCP Tool Node**     | 🟡 Pending | 🟡 Pending         | 🟡 Pending       | Verify Registry source switching and dynamic schema. |
| **Loop Node**         | 🟡 Pending | 🟡 Pending         | 🟡 Pending       | Test condition code validation and test execution.   |
| **A2A Node**          | 🟡 Pending | 🟡 Pending         | 🟡 Pending       | Verify encryption and protocol version toggles.      |
| **Condition Node**    | 🟡 Pending | 🟡 Pending         | 🟡 Pending       | Test JS expression evaluation logic.                 |
| **Transform Node**    | 🟡 Pending | 🟡 Pending         | 🟡 Pending       | Verify JS/JSONPath/Template transformation logic.    |
| **Input Node**        | 🟡 Pending | 🟡 Pending         | 🟡 Pending       | Check dynamic output handle generation.              |
| **Notification Node** | 🟡 Pending | 🟡 Pending         | 🟡 Pending       | Test UI Toast and Email/Slack integrations.          |
| **Output Node**       | 🟡 Pending | 🟡 Pending         | 🟡 Pending       | Check dynamic input handle generation.               |
| **Prompt Node**       | 🟡 Pending | 🟡 Pending         | 🟡 Pending       | Verify variable extraction and template selection.   |
| **Subworkflow Node**  | 🟡 Pending | 🟡 Pending         | 🟡 Pending       | Test nested execution and mapping logic.             |

---

## QA Scenarios

1. **Simple Agent Flow**: Input Node → Agent Node → Output Node. Verify agent
   receives input and output is captured.
2. **MCP Tool Integration**: Search for an official registry tool, configure it,
   and execute.
3. **Complex Logic**: Loop Node containing a Transform Node and a Condition Node
   for exit.
4. **Nested Workflows**: Create a workflow, then use it as a Subworkflow Node in
   another workflow.
5. **A2A Communication**: Two Agent nodes communicating via A2A Node with
   encryption enabled.

## Acceptance Criteria

- [ ] All nodes in the matrix are marked as "✅ Complete" for all status
      columns.
- [ ] No console errors during builder usage or workflow execution.
- [ ] All QA scenarios pass in the production/staging environment.
- [ ] UI remains usable and clean on 1280px and 1920px widths.
