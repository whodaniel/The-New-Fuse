# AI Contextual Prompting Pattern

## Overview

This document describes the **AI Contextual Prompting** pattern discovered
during TNF Chrome Extension testing. This pattern solves the problem of AI
agents blindly automating UI interactions without understanding the correct
procedures.

## The Problem

During automated testing of the TNF Chrome Extension floating panel, the AI
attempted to create a channel named "Blue" by:

1. Opening the floating panel ✅
2. Typing "Blue" in the main chat message input ❌
3. Pressing Enter ❌

**Result**: Channel was not created because the AI didn't follow the proper UI
workflow.

## The Missing Step: Contextual Guidance

The AI should have **asked the system** "How do I create a channel?" before
attempting automation. This represents a fundamental pattern: **query before
execute**.

## The Correct Procedure

### Channel Creation Workflow

Based on `apps/chrome-extension/src/v5/content/injectable/FloatingPanel.ts`:

```typescript
// UI Structure (lines 1144-1159)
renderChannelsTab(): string {
  return `
    <div class="fcp6-create-channel-form">
      <div>Create New Channel</div>
      <input type="text" id="fuse-new-channel-name" placeholder="Channel name..." />
      <button data-action="submit-create-channel">Create</button>
    </div>
  `;
}

// Handler (lines 1704-1741)
submitCreateChannel(): void {
  const input = this.container?.querySelector('#fuse-new-channel-name');
  const name = input.value.trim();

  chrome.runtime.sendMessage({
    type: 'CHANNEL_CREATE',
    name,
  });

  // Optimistically add to local state
  this.channels.push({ id: `local-${Date.now()}`, name, ... });
  this.update();
}
```

### Correct Steps

1. **Open floating panel** - Press Ctrl+Shift+F
2. **Navigate to Channels tab** - Click the 📢 Channels tab
3. **Locate channel creation form** - Find "Create New Channel" section
4. **Enter channel name** - Type in `#fuse-new-channel-name` input
5. **Submit** - Click "Create" button OR press Enter
6. **Verify** - Channel appears in "Your Channels" list
7. **Select channel** - Click channel row OR select from dropdown

## The Pattern: Tool + Prompt Chain

### Traditional Automation (Fails)

```
AI → Tool Call (AppleScript) → UI Action → Hope it works
```

### AI Contextual Prompting (Succeeds)

```
AI → Query System ("How do I...?")
  → Read Documentation/Code
  → Understand Procedure
  → Execute Tool Calls
  → Verify Each Step
  → Handle Errors with Context
```

## Implementation as a Skill

### Skill Structure

```typescript
// .claude/skills/ui-automation-with-context.md

## Skill: UI Automation with Contextual Prompting

### When to Use
- Automating UI interactions in unfamiliar interfaces
- Testing workflows with multi-step procedures
- Verifying complex user interactions

### Workflow

1. **Query Phase**: Ask "How do I perform X?"
   - Read relevant code/documentation
   - Identify UI elements and their IDs
   - Understand the sequence of interactions
   - Note error conditions

2. **Plan Phase**: Create step-by-step procedure
   - List required UI elements
   - Define expected outcomes
   - Identify verification points

3. **Execute Phase**: Perform automation
   - Use appropriate tools (AppleScript, Browser MCP, etc.)
   - Take screenshots at each step
   - Verify expected state changes

4. **Verify Phase**: Confirm success
   - Check UI state matches expectations
   - Verify data persistence
   - Test error conditions

5. **Adapt Phase**: Handle failures
   - Query system for error guidance
   - Adjust procedure based on feedback
   - Document discovered edge cases
```

### Example: Creating TNF Channel

```javascript
// Step 1: Query
async function queryChannelCreationProcedure() {
  const code = await read('FloatingPanel.ts');
  const procedure = extractProcedure(code, 'submitCreateChannel');
  const uiElements = extractUIElements(code, 'renderChannelsTab');

  return {
    procedure,
    requiredElements: [
      '#fuse-new-channel-name',
      'button[data-action="submit-create-channel"]',
    ],
    tabs: ['channels'],
    sequence: ['navigate_to_tab', 'fill_input', 'click_button', 'verify_list'],
  };
}

// Step 2: Execute with Verification
async function createChannelWithContext(channelName) {
  // Navigate to Channels tab
  await clickElement('button[data-tab="channels"]');
  await screenshot('01-channels-tab.png');

  // Verify tab is active
  const isActive = await checkElement('.fcp6-tab.active[data-tab="channels"]');
  if (!isActive) throw new Error('Failed to activate Channels tab');

  // Fill input
  await fillInput('#fuse-new-channel-name', channelName);
  await screenshot('02-channel-name-entered.png');

  // Submit
  await clickButton('[data-action="submit-create-channel"]');
  await wait(500);
  await screenshot('03-channel-created.png');

  // Verify creation
  const channelExists = await checkElement(
    `[data-channel]:contains("${channelName}")`
  );
  if (!channelExists) throw new Error('Channel not found in list');

  return { success: true, channelName };
}
```

## Benefits

### 1. Self-Correcting Automation

- AI can adapt to UI changes by re-querying procedures
- Failures trigger contextual guidance requests
- No hard-coded assumptions

### 2. Documentation as Truth

- Code/docs become the source of truth for procedures
- AI extracts workflows from implementation
- Reduces need for separate automation docs

### 3. Human-Like Exploration

- AI "learns" the UI before automating
- Mimics how humans read documentation first
- More robust than blind clicking

### 4. Reusable Pattern

- Applicable to any UI automation task
- Works across different technologies (web, desktop, CLI)
- Scales from simple buttons to complex workflows

## Integration Points

### 1. MCP Browser Tool

```javascript
// Query before action
const procedure = await mcp.browser.getProcedure('create_channel');
await mcp.browser.executeWithVerification(procedure);
```

### 2. Agent Skills

```javascript
// Skill registers self-documentation endpoint
skill.register({
  name: 'channel-creation',
  procedure: extractFromCode('FloatingPanel.ts'),
  query: '/api/skills/channel-creation/how-to',
});
```

### 3. Extension Popup

```javascript
// Extension exposes "Help" endpoint
chrome.runtime.onMessage.addListener((msg) => {
  if (msg.type === 'QUERY_PROCEDURE') {
    return { procedure: getProcedureGuide(msg.feature) };
  }
});
```

## Future Enhancements

### 1. Auto-Generated Guides

- Parse code to generate procedure documentation
- Use AST analysis to extract UI workflows
- LLM summarizes procedures from implementation

### 2. Interactive Prompting

- UI provides real-time guidance to AI agents
- Tooltips/hints exposed via accessibility APIs
- Step-by-step wizards with agent hooks

### 3. Validation Framework

```typescript
interface Procedure {
  id: string;
  name: string;
  steps: Step[];
  verification: VerificationRule[];
  errorHandling: ErrorStrategy;
}

interface Step {
  id: string;
  description: string;
  requiredElements: string[];
  actions: Action[];
  expectedOutcome: string;
}
```

## Lessons Learned

### What Went Wrong

1. **Assumed UI workflow** without querying documentation
2. **Used wrong input field** (chat message vs. channel creation)
3. **Skipped tab navigation** (stayed on Chat tab vs. switching to Channels)
4. **No verification** of UI state before proceeding
5. **No error context** when channel didn't appear

### What Should Happen

1. **Query the system**: "How do I create a channel in this UI?"
2. **Read the implementation**: Parse `FloatingPanel.ts` for procedure
3. **Identify UI elements**: Note required IDs, tabs, buttons
4. **Execute with verification**: Take screenshots, check state
5. **Handle errors contextually**: If failed, re-query for error guidance

## Conclusion

The **AI Contextual Prompting Pattern** transforms blind automation into
intelligent, self-guided workflows. By querying systems for guidance before
executing actions, AI agents can:

- Adapt to UI changes
- Self-correct when procedures fail
- Provide better error messages
- Document their own discoveries

This pattern should become a **standard practice** for AI-driven testing,
automation, and user assistance.

## Related Patterns

- **Query-Execute-Verify (QEV)** Loop
- **Documentation-Driven Development (DDD)**
- **Self-Documenting Systems**
- **Conversational UI Automation**

## References

- TNF Chrome Extension:
  `apps/chrome-extension/src/v5/content/injectable/FloatingPanel.ts`
- Test Report:
  `/path/to/Desktop/A1-Inter-LLM-Com/The-New-Fuse/COMPREHENSIVE_TEST_REPORT.md`
- Original Issue: Channel creation failed during automated testing (2025-01-13)
