# UI Development Standards & Practices

## Overview

This document defines the standards and practices for UI development across all
TNF (The New Fuse) network components. These standards ensure consistency,
accessibility, testability, and AI-agent compatibility across all interfaces.

## Required Element Identification Attributes

### 1. Semantic IDs (`id`)

Every interactive element MUST have a unique, descriptive ID following this
pattern:

```
{component-prefix}-{element-type}-{descriptor}
```

**Examples:**

- `fuse-btn-toggle` (toggle button in Fuse panel)
- `settings-input-relay-url` (relay URL input in settings)
- `chat-message-container` (chat message container)

### 2. Test IDs (`data-testid`)

All interactive and important elements MUST have a `data-testid` attribute for
automation testing:

```html
<button id="fuse-btn-inject" data-testid="fuse-btn-inject">Send</button>
```

### 3. Accessibility Labels (`aria-label`)

Every interactive element MUST have an `aria-label` that describes its purpose
in plain language:

```html
<button aria-label="Inject message into page chat">💬</button>
```

### 4. Action Identifiers (`data-action`)

Buttons and clickable elements that trigger actions MUST have a `data-action`
attribute:

```html
<button data-action="inject-to-chat">Send to Chat</button>
```

## Element Categories & Required Attributes

### Buttons

```html
<button
  id="{prefix}-btn-{action}"
  data-testid="{prefix}-btn-{action}"
  data-action="{action-name}"
  aria-label="Descriptive action label"
  title="Tooltip text"
>
  Content
</button>
```

### Input Fields

```html
<input
  id="{prefix}-input-{field-name}"
  data-testid="{prefix}-input-{field-name}"
  data-input="{field-type}"
  aria-label="Descriptive field label"
  placeholder="Helpful placeholder text"
/>
```

### Textareas

```html
<textarea
  id="{prefix}-textarea-{field-name}"
  data-testid="{prefix}-textarea-{field-name}"
  data-input="{field-type}"
  aria-label="Descriptive field label"
  placeholder="Helpful placeholder text"
></textarea>
```

### Panels/Containers

```html
<div
  id="{prefix}-panel-{name}"
  data-testid="{prefix}-panel-{name}"
  aria-label="Descriptive panel label"
  role="region"
>
  Content
</div>
```

### Tabs

```html
<button
  id="{prefix}-tab-{tab-name}"
  data-testid="{prefix}-tab-{tab-name}"
  data-tab="{tab-name}"
  role="tab"
  aria-selected="true|false"
  aria-label="Tab description"
>
  Tab Label
</button>
```

## Component Prefix Standards

| Component          | Prefix     | Example                |
| ------------------ | ---------- | ---------------------- |
| Fuse Connect Panel | `fuse`     | `fuse-btn-send`        |
| Settings           | `settings` | `settings-input-url`   |
| Chat               | `chat`     | `chat-message-list`    |
| Agent              | `agent`    | `agent-card-123`       |
| Channel            | `channel`  | `channel-item-general` |
| Service            | `service`  | `service-status-relay` |
| Auth               | `auth`     | `auth-btn-login`       |
| Navigation         | `nav`      | `nav-link-home`        |

## AI Agent Compatibility

### Why This Matters

AI agents (browser automation, testing agents, accessibility tools) need
reliable ways to identify and interact with UI elements. By following these
standards:

1. **Browser subagents** can easily find elements using
   `querySelector('#fuse-btn-inject')` or
   `querySelector('[data-testid="fuse-btn-inject"]')`
2. **Test automation** can target elements reliably without fragile CSS
   selectors
3. **Accessibility tools** can provide meaningful descriptions to users
4. **Cross-component communication** is simplified with consistent naming

### Discovery Patterns for AI Agents

AI agents should look for elements in this priority order:

1. `id` attribute: `document.querySelector('#fuse-btn-inject')`
2. `data-testid` attribute:
   `document.querySelector('[data-testid="fuse-btn-inject"]')`
3. `data-action` attribute:
   `document.querySelector('[data-action="inject-to-chat"]')`
4. `aria-label` attribute:
   `document.querySelector('[aria-label="Inject message"]')`

## Implementation Checklist

When creating any UI component, ensure:

- [ ] All interactive elements have unique `id` attributes
- [ ] All elements have `data-testid` matching their `id`
- [ ] All buttons have `data-action` attributes
- [ ] All form inputs have `data-input` attributes
- [ ] All interactive elements have `aria-label` attributes
- [ ] Containers/panels have `role` attributes where appropriate
- [ ] Tooltips are provided via `title` attribute
- [ ] IDs follow the `{prefix}-{type}-{name}` naming convention

## Examples from Fuse Connect Panel

### Good Example ✅

```html
<button
  class="fcp6-inject-btn"
  id="fuse-btn-inject"
  data-testid="fuse-btn-inject"
  data-action="inject-to-chat"
  title="Send to page chat"
  aria-label="Inject message into page chat"
>
  💬
</button>
```

### Bad Example ❌

```html
<button class="fcp6-inject-btn">💬</button>
```

## Validation

Before submitting UI code, verify:

1. Run `grep -r 'class=".*btn"' | grep -v 'id='` to find buttons without IDs
2. Ensure all interactive elements are keyboard accessible
3. Test with screen reader to verify aria-labels make sense
4. Verify AI agents can find elements using the documented patterns

## Changelog

- **2025-12-26**: Initial standards document created
  - Defined ID naming conventions
  - Established data-testid requirements
  - Added aria-label requirements
  - Created component prefix standards
  - Added AI agent compatibility guidelines
