---
name: ui-automation-with-context
description:
  'Demonstrates the AI Contextual Prompting pattern for UI automation: Query the
  system for procedures before executing actions, enabling self-correcting and
  context-aware automation workflows.'
tools: [Read, Grep, Glob, Bash, WebFetch]
category: automation
pattern: Query-Execute-Verify (QEV)
color: Cyan
---

# UI Automation with Contextual Prompting

## Purpose

This skill demonstrates the **AI Contextual Prompting Pattern** - a methodology
for intelligent UI automation that queries systems for guidance before executing
actions, enabling self-correcting workflows that adapt to changes and handle
errors contextually.

## Core Philosophy

**Traditional Automation (Blind)**:

```
AI → Tool Call → UI Action → Hope it works ❌
```

**Contextual Prompting (Intelligent)**:

```
AI → Query ("How do I...?")
   → Read Documentation/Code
   → Understand Procedure
   → Execute with Verification
   → Handle Errors Contextually ✅
```

## When to Use This Skill

Use this pattern when:

- Automating unfamiliar UI interactions
- Testing multi-step workflows
- Creating robust automation that survives UI changes
- Building self-documenting test suites
- Need error handling with contextual awareness

## The Pattern: Five Phases

### Phase 1: Query 🔍

**Ask the system: "How do I perform X?"**

```javascript
// Example: Query for channel creation procedure
const procedure = await queryProcedure({
  feature: 'create_channel',
  sources: ['FloatingPanel.ts', 'README.md', '/api/docs/channels'],
});

// Extract:
// - Required UI elements and their IDs
// - Sequence of interactions
// - Expected outcomes
// - Error conditions
```

**Tools**: Read, Grep, Glob, WebFetch

### Phase 2: Plan 📋

**Create step-by-step procedure with verification points**

```javascript
const plan = {
  steps: [
    {
      id: 1,
      action: 'Navigate to Channels tab',
      target: 'button[data-tab="channels"]',
      verify: '.fcp6-tab.active[data-tab="channels"]',
      screenshot: '01-channels-tab.png',
    },
    {
      id: 2,
      action: 'Fill channel name input',
      target: '#fuse-new-channel-name',
      value: 'Blue',
      verify: '#fuse-new-channel-name[value="Blue"]',
      screenshot: '02-name-entered.png',
    },
    {
      id: 3,
      action: 'Submit channel creation',
      target: '[data-action="submit-create-channel"]',
      verify: '.fcp6-channel:contains("Blue")',
      screenshot: '03-channel-created.png',
    },
  ],
  rollback: 'Delete channel if exists',
  timeout: 5000,
};
```

**Tools**: None (planning phase)

### Phase 3: Execute ⚙️

**Perform automation with verification at each step**

```javascript
for (const step of plan.steps) {
  try {
    // Execute action
    await performAction(step.action, step.target, step.value);

    // Wait for state change
    await wait(500);

    // Verify expected outcome
    const success = await verifyElement(step.verify);

    if (!success) {
      throw new Error(`Step ${step.id} verification failed`);
    }

    // Capture evidence
    await screenshot(step.screenshot);
  } catch (error) {
    // Contextual error handling
    const guidance = await queryErrorGuidance(step.id, error);
    await handleWithContext(error, guidance);
  }
}
```

**Tools**: Bash (for AppleScript), MCP Browser tools, Read (for element
verification)

### Phase 4: Verify ✅

**Confirm success and data persistence**

```javascript
const verification = {
  uiState: await checkUIState('.fcp6-channel:contains("Blue")'),
  dataState: await checkDataState('channels', 'Blue'),
  serverState: await checkServerState('/api/channels/Blue'),
  screenshots: capturedScreenshots,
};

if (!verification.uiState || !verification.dataState) {
  throw new Error('Verification failed');
}
```

**Tools**: Read, Bash, WebFetch

### Phase 5: Adapt 🔄

**Handle failures by re-querying and adjusting**

```javascript
if (failed) {
  // Query system for error guidance
  const errorContext = await queryErrorGuidance({
    feature: 'create_channel',
    error: error.message,
    step: currentStep,
  });

  // Adjust procedure based on guidance
  const adjustedProcedure = await adjustProcedure(
    originalProcedure,
    errorContext
  );

  // Retry with adjusted procedure
  await retry(adjustedProcedure);
}
```

**Tools**: Read, Grep, Glob

## Real-World Example: TNF Channel Creation

### What Went Wrong (Blind Automation)

```javascript
// ❌ Attempted without querying procedure
openPanel(); // ✅ Opened panel successfully
typeInChatInput('Blue'); // ❌ Wrong input field (used chat message input)
pressEnter(); // ❌ Sent as chat message, not channel creation
// Result: Channel not created
```

### What Should Happen (Contextual Prompting)

```javascript
// Phase 1: Query
const procedure = await readFile('FloatingPanel.ts');
const channelCreation = extractFunction(procedure, 'submitCreateChannel');
const ui = extractFunction(procedure, 'renderChannelsTab');

// Discovered:
// - Need to click Channels tab first (not stay on Chat tab)
// - Use input with ID #fuse-new-channel-name (not chat message input)
// - Either click Create button OR press Enter in that input

// Phase 2: Plan
const steps = [
  { action: 'Open panel', key: 'Ctrl+Shift+F' },
  { action: 'Click Channels tab', selector: '[data-tab="channels"]' },
  {
    action: 'Fill channel name',
    selector: '#fuse-new-channel-name',
    value: 'Blue',
  },
  {
    action: 'Submit',
    method: 'pressEnter OR click [data-action="submit-create-channel"]',
  },
  { action: 'Verify', selector: '.fcp6-channel:contains("Blue")' },
];

// Phase 3: Execute (with verification)
openPanel();
await screenshot('01-panel-opened.png');

clickTab('channels');
await verifyTabActive('channels');
await screenshot('02-channels-tab.png');

fillInput('#fuse-new-channel-name', 'Blue');
await verifyInputValue('#fuse-new-channel-name', 'Blue');
await screenshot('03-name-entered.png');

pressEnter();
await wait(500);
await screenshot('04-channel-created.png');

// Phase 4: Verify
const channelExists = await checkElement('.fcp6-channel:contains("Blue")');
assert(channelExists, 'Channel Blue should exist in list');

// Phase 5: Adapt (if failed)
if (!channelExists) {
  const guidance = await queryErrorGuidance('create_channel', 'not_found');
  // Guidance might reveal: "Channels require relay connection first"
  await connectToRelay();
  await retryChannelCreation('Blue');
}
```

## Implementation Examples

### AppleScript Automation

```bash
# Query procedure first
procedure=$(grep -A 20 "submitCreateChannel" FloatingPanel.ts)

# Execute with verification
osascript <<'EOF'
tell application "Google Chrome"
  activate
  tell application "System Events"
    # Open panel
    keystroke "f" using {control down, shift down}
    delay 0.5

    # Click Channels tab (requires element inspection)
    click button "Channels" of window 1
    delay 0.5

    # Fill input
    set value of text field "fuse-new-channel-name" to "Blue"
    delay 0.2

    # Submit
    key code 36 -- Enter key
    delay 0.5
  end tell
end tell
EOF

# Verify
screencapture -x channel-created.png
grep -q "Blue" channel-created.png || echo "ERROR: Channel not found"
```

### MCP Browser Integration

```javascript
// Query procedure from docs
const docs = await mcp.filesystem.readFile('FloatingPanel.ts');
const procedure = extractProcedure(docs, 'createChannel');

// Execute with MCP browser tools
await mcp.browser.navigate('gemini.google.com/app');
await mcp.browser.click('button[aria-label="Fuse Connect"]');
await mcp.browser.click('[data-tab="channels"]');
await mcp.browser.type('#fuse-new-channel-name', 'Blue');
await mcp.browser.pressKey('Enter');

// Verify
const snapshot = await mcp.browser.snapshot();
assert(snapshot.includes('Blue'), 'Channel should be visible');
```

## Integration with TNF Systems

### 1. Extension Self-Documentation

```javascript
// Extension exposes procedure documentation
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === 'QUERY_PROCEDURE') {
    const procedure = getProcedureGuide(msg.feature);
    sendResponse({ procedure });
  }
});

// AI queries before automating
const procedure = await chrome.runtime.sendMessage({
  type: 'QUERY_PROCEDURE',
  feature: 'create_channel',
});
```

### 2. Agent Skill Registration

```javascript
// Register skill with procedure documentation
registerSkill({
  id: 'channel-creation',
  name: 'Create Channel',
  procedure: {
    steps: extractFromCode('FloatingPanel.ts'),
    elements: ['#fuse-new-channel-name', '[data-tab="channels"]'],
    verification: ['.fcp6-channel'],
  },
  query: (question) => {
    // AI can ask: "How do I create a channel?"
    return formatProcedureGuide(this.procedure);
  },
});
```

### 3. Test Automation Framework

```javascript
// Self-documenting test suite
describe('Channel Creation', () => {
  beforeEach(async () => {
    // Query procedure before each test
    this.procedure = await queryProcedure('create_channel');
  });

  it('should create channel with contextual awareness', async () => {
    // Execute procedure with verification
    const result = await executeWithContext(this.procedure, {
      channelName: 'Test',
    });

    expect(result.success).toBe(true);
    expect(result.screenshots).toHaveLength(4);
  });
});
```

## Benefits

### 1. Self-Correcting ✨

- Adapts to UI changes by re-querying procedures
- Failures trigger contextual guidance requests
- No hard-coded assumptions break automation

### 2. Self-Documenting 📚

- Code/docs become source of truth for procedures
- AI extracts workflows from implementation
- Tests document themselves through queries

### 3. Human-Like 🧠

- AI "learns" the UI before automating
- Mimics how humans read documentation first
- More robust than blind clicking

### 4. Reusable 🔄

- Pattern applies to any UI automation task
- Works across web, desktop, CLI
- Scales from simple buttons to complex workflows

## Anti-Patterns to Avoid

### ❌ Blind Clicking

```javascript
// BAD: No verification, no context
click('#some-button');
wait(1000);
click('#another-button');
```

### ❌ Hard-Coded Assumptions

```javascript
// BAD: Assumes specific workflow without querying
openPanel();
typeInFirstInput('value'); // Assumes first input is correct
pressEnter(); // Assumes Enter submits form
```

### ❌ No Error Context

```javascript
// BAD: Generic error with no guidance
try {
  createChannel('Blue');
} catch (error) {
  throw new Error('Failed to create channel'); // No context!
}
```

## Best Practices

### ✅ Query Before Execute

```javascript
// GOOD: Always query procedure first
const procedure = await queryProcedure('feature_name');
const result = await executeWithVerification(procedure);
```

### ✅ Verify Each Step

```javascript
// GOOD: Verify state changes
await click('[data-tab="channels"]');
const isActive = await checkElement('.fcp6-tab.active[data-tab="channels"]');
if (!isActive) throw new VerificationError('Tab not activated');
```

### ✅ Contextual Error Handling

```javascript
// GOOD: Re-query on failure
try {
  await executeStep(step);
} catch (error) {
  const guidance = await queryErrorGuidance(step, error);
  await retryWithGuidance(step, guidance);
}
```

### ✅ Capture Evidence

```javascript
// GOOD: Screenshots at each step
for (const step of procedure.steps) {
  await executeStep(step);
  await screenshot(`${step.id}-${step.name}.png`);
}
```

## Usage Instructions

### As Claude Code Skill

```bash
# Invoke this skill for UI automation tasks
/automate-ui "Create channel named Blue in TNF extension"

# Skill will:
# 1. Query procedure from codebase
# 2. Plan steps with verification
# 3. Execute with screenshots
# 4. Verify success
# 5. Report results with evidence
```

### As Development Pattern

```javascript
// Import pattern in your test code
import { queryExecuteVerify } from '@tnf/ui-automation-with-context';

// Use for any UI automation
const result = await queryExecuteVerify({
  feature: 'login',
  target: 'https://app.example.com',
  params: { username: 'test@example.com', password: 'secret' },
});
```

### As Agent Capability

```javascript
// Register with TNF agent system
agent.registerCapability({
  name: 'ui-automation-with-context',
  query: true, // Supports contextual queries
  execute: async (task) => {
    const procedure = await queryProcedure(task.feature);
    return await executeWithContext(procedure, task.params);
  },
});
```

## Related Documentation

- [AI Contextual Prompting Pattern](/docs/AI_CONTEXTUAL_PROMPTING_PATTERN.md) -
  Full pattern documentation
- [FloatingPanel.ts](apps/chrome-extension/src/v5/content/injectable/FloatingPanel.ts) -
  Source of truth for UI procedures
- [Comprehensive Test Report](/COMPREHENSIVE_TEST_REPORT.md) - Real-world
  example of pattern discovery

## Lesson from TNF Testing (2025-01-13)

**What we learned**: During automated testing, the AI attempted to create a
channel by typing in the wrong input field (chat message input instead of
channel creation form) and skipped the required tab navigation step.

**Root cause**: The AI didn't **query the system** for the correct procedure
before executing automation.

**Solution**: This skill. Always Query → Execute → Verify.

## Future Enhancements

1. **Auto-generated procedure docs** from code AST analysis
2. **Interactive UI guidance** with tooltips for AI agents
3. **Procedure versioning** to track UI workflow changes
4. **Natural language queries**: "How do I create a channel?" → structured
   procedure
5. **Cross-platform adapters** for web, desktop, mobile UI automation

## License

Part of The New Fuse project. Use this pattern to build more intelligent,
self-correcting automation systems.
