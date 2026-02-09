# Chrome DevTools Browser Automation

**Slash Command**: `/browser-automate` or `/devtools-interact`

**Category**: Browser Automation & Testing

**Compatible With**: Claude Code, Gemini Antigravity, Any MCP-enabled AI assistant

---

## Purpose

Comprehensive browser automation using Chrome DevTools Protocol. Control Chrome programmatically to click elements, fill forms, navigate pages, handle dialogs, upload files, and perform complex user interaction scenarios for testing and debugging.

## Prerequisites

### MCP Server Configuration

Add to your MCP config file:

```json
{
  "mcpServers": {
    "chrome-devtools": {
      "command": "npx",
      "args": ["-y", "chrome-devtools-mcp@latest"]
    }
  }
}
```

---

## Available Tools

## 🖱️ Input Automation (8 tools)

### 1. Click Element

**Tool Name**: `click`

**Purpose**: Click on a page element by its unique identifier

**Parameters**:
- `uid` (required, string): Unique element identifier from `take_snapshot`
- `dblClick` (optional, boolean): Perform double-click instead of single click

**Example**:
```json
{
  "name": "click",
  "arguments": {
    "uid": "#submit-button",
    "dblClick": false
  }
}
```

---

### 2. Fill Input Field

**Tool Name**: `fill`

**Purpose**: Type text into input, textarea, or select an option from `<select>`

**Parameters**:
- `uid` (required, string): Element identifier
- `value` (required, string): Text to type or option to select

**Example**:
```json
{
  "name": "fill",
  "arguments": {
    "uid": "#email-input",
    "value": "test@example.com"
  }
}
```

---

### 3. Fill Form

**Tool Name**: `fill_form`

**Purpose**: Fill multiple form elements at once

**Parameters**:
- `elements` (required, array): Array of `{ uid, value }` objects

**Example**:
```json
{
  "name": "fill_form",
  "arguments": {
    "elements": [
      { "uid": "#username", "value": "johndoe" },
      { "uid": "#email", "value": "john@example.com" },
      { "uid": "#password", "value": "securePass123" },
      { "uid": "#country", "value": "USA" }
    ]
  }
}
```

---

### 4. Hover Over Element

**Tool Name**: `hover`

**Purpose**: Trigger hover effects on an element

**Parameters**:
- `uid` (required, string): Element identifier

**Example**:
```json
{
  "name": "hover",
  "arguments": {
    "uid": "#dropdown-menu"
  }
}
```

---

### 5. Press Key

**Tool Name**: `press_key`

**Purpose**: Press keyboard keys or key combinations

**Parameters**:
- `key` (required, string): Key name or combination

**Supported Keys**:
- Single keys: `"Enter"`, `"Escape"`, `"Tab"`, `"Backspace"`, `"Delete"`
- Combinations: `"Control+A"`, `"Control+C"`, `"Control+V"`, `"Control+Shift+R"`
- Arrow keys: `"ArrowUp"`, `"ArrowDown"`, `"ArrowLeft"`, `"ArrowRight"`

**Example**:
```json
{
  "name": "press_key",
  "arguments": {
    "key": "Enter"
  }
}

// Ctrl+A to select all
{
  "name": "press_key",
  "arguments": {
    "key": "Control+A"
  }
}
```

---

### 6. Drag and Drop

**Tool Name**: `drag`

**Purpose**: Drag one element onto another

**Parameters**:
- `from_uid` (required, string): Source element identifier
- `to_uid` (required, string): Target element identifier

**Example**:
```json
{
  "name": "drag",
  "arguments": {
    "from_uid": "#draggable-item",
    "to_uid": "#drop-zone"
  }
}
```

---

### 7. Upload File

**Tool Name**: `upload_file`

**Purpose**: Upload a file through a file input element

**Parameters**:
- `filePath` (required, string): Absolute path to file
- `uid` (required, string): File input element identifier

**Example**:
```json
{
  "name": "upload_file",
  "arguments": {
    "filePath": "/Users/test/Documents/resume.pdf",
    "uid": "#file-upload"
  }
}
```

---

### 8. Handle Dialog

**Tool Name**: `handle_dialog`

**Purpose**: Handle browser dialogs (alert, confirm, prompt)

**Parameters**:
- `action` (required, enum): `"accept"` or `"dismiss"`
- `promptText` (optional, string): Text to enter in prompt dialogs

**Example**:
```json
// Accept alert
{
  "name": "handle_dialog",
  "arguments": {
    "action": "accept"
  }
}

// Enter text in prompt and accept
{
  "name": "handle_dialog",
  "arguments": {
    "action": "accept",
    "promptText": "My response"
  }
}
```

---

## 🧭 Navigation Automation (6 tools)

### 9. Navigate to URL

**Tool Name**: `navigate_page`

**Purpose**: Navigate the current page to a URL or use browser navigation

**Parameters**:
- `type` (optional, enum): `"url"`, `"back"`, `"forward"`, `"reload"`
- `url` (optional, string): URL to navigate to (required if type is "url")
- `ignoreCache` (optional, boolean): Bypass cache when reloading
- `timeout` (optional, integer): Navigation timeout in ms (default: 30000)

**Example**:
```json
// Navigate to URL
{
  "name": "navigate_page",
  "arguments": {
    "type": "url",
    "url": "https://example.com"
  }
}

// Go back
{
  "name": "navigate_page",
  "arguments": {
    "type": "back"
  }
}

// Reload without cache
{
  "name": "navigate_page",
  "arguments": {
    "type": "reload",
    "ignoreCache": true
  }
}
```

---

### 10. Create New Page

**Tool Name**: `new_page`

**Purpose**: Open a new browser tab/page

**Parameters**:
- `url` (required, string): URL to load in new page
- `timeout` (optional, integer): Load timeout in ms

**Example**:
```json
{
  "name": "new_page",
  "arguments": {
    "url": "https://example.com",
    "timeout": 30000
  }
}
```

---

### 11. List Open Pages

**Tool Name**: `list_pages`

**Purpose**: Get list of all open browser tabs/pages

**Parameters**: None

**Returns**: Array of `{ id, url, title }` objects

**Example**:
```json
{
  "name": "list_pages",
  "arguments": {}
}
```

---

### 12. Select Page

**Tool Name**: `select_page`

**Purpose**: Switch to a different browser tab/page

**Parameters**:
- `pageId` (required, number): Page ID from `list_pages`
- `bringToFront` (optional, boolean): Bring page to front/focus

**Example**:
```json
{
  "name": "select_page",
  "arguments": {
    "pageId": 2,
    "bringToFront": true
  }
}
```

---

### 13. Close Page

**Tool Name**: `close_page`

**Purpose**: Close a browser tab/page by its ID

**Parameters**:
- `pageId` (required, number): Page ID from `list_pages`

**Note**: Cannot close the last open page

**Example**:
```json
{
  "name": "close_page",
  "arguments": {
    "pageId": 3
  }
}
```

---

### 14. Wait For Text

**Tool Name**: `wait_for`

**Purpose**: Wait for specific text to appear on the page

**Parameters**:
- `text` (required, string): Text to wait for
- `timeout` (optional, integer): Max wait time in ms (default: 30000)

**Example**:
```json
{
  "name": "wait_for",
  "arguments": {
    "text": "Login successful",
    "timeout": 5000
  }
}
```

---

## 📸 Debugging Tools (2 tools)

### 15. Take Screenshot

**Tool Name**: `take_screenshot`

**Purpose**: Capture screenshot of page or specific element

**Parameters**:
- `filePath` (optional, string): Where to save screenshot
- `format` (optional, enum): `"png"`, `"jpeg"`, `"webp"` (default: "png")
- `quality` (optional, number): 0-100 (for jpeg/webp)
- `fullPage` (optional, boolean): Capture entire scrollable page
- `uid` (optional, string): Capture specific element only

**Example**:
```json
// Full page screenshot
{
  "name": "take_screenshot",
  "arguments": {
    "filePath": "/tmp/page.png",
    "fullPage": true
  }
}

// Element screenshot
{
  "name": "take_screenshot",
  "arguments": {
    "filePath": "/tmp/element.png",
    "uid": "#error-message"
  }
}
```

---

### 16. Take Snapshot

**Tool Name**: `take_snapshot`

**Purpose**: Get text representation of page structure with element UIDs

**Parameters**:
- `filePath` (optional, string): Save snapshot to file
- `verbose` (optional, boolean): Include additional element details

**Returns**: Accessibility tree with unique IDs for each interactive element

**Example**:
```json
{
  "name": "take_snapshot",
  "arguments": {
    "verbose": true
  }
}
```

**Use Case**: Get UIDs for elements before clicking/filling

---

## 🎭 Emulation Tools (2 tools)

### 17. Emulate Conditions

**Tool Name**: `emulate`

**Purpose**: Emulate CPU throttling, network conditions, and geolocation

**Parameters**:
- `cpuThrottlingRate` (optional, number): CPU slowdown multiplier (e.g., 4 = 4x slower)
- `networkConditions` (optional, enum): `"Slow-3G"`, `"Fast-3G"`, `"Slow-4G"`, `"Fast-4G"`, `"Offline"`
- `geolocation` (optional, object): `{ latitude, longitude, accuracy }`

**Example**:
```json
// Emulate slow mobile device
{
  "name": "emulate",
  "arguments": {
    "cpuThrottlingRate": 6,
    "networkConditions": "Slow-3G"
  }
}

// Emulate location
{
  "name": "emulate",
  "arguments": {
    "geolocation": {
      "latitude": 37.7749,
      "longitude": -122.4194,
      "accuracy": 100
    }
  }
}
```

---

### 18. Resize Page

**Tool Name**: `resize_page`

**Purpose**: Resize browser window to specific dimensions

**Parameters**:
- `width` (required, number): Width in pixels
- `height` (required, number): Height in pixels

**Example**:
```json
// Mobile viewport
{
  "name": "resize_page",
  "arguments": {
    "width": 375,
    "height": 667
  }
}

// Desktop viewport
{
  "name": "resize_page",
  "arguments": {
    "width": 1920,
    "height": 1080
  }
}
```

---

## Workflow Examples

### Example 1: Complete Form Submission

```markdown
**User Request**: "Fill out and submit the contact form"

**Agent Workflow**:

1. Navigate to contact page:
   Tool: navigate_page({ type: "url", url: "https://example.com/contact" })

2. Wait for form to load:
   Tool: wait_for({ text: "Contact Us", timeout: 5000 })

3. Take snapshot to get element UIDs:
   Tool: take_snapshot({ verbose: false })

   Response:
   ```
   heading "Contact Us"
   textbox "Name" [#name-input]
   textbox "Email" [#email-input]
   textbox "Message" [#message-textarea]
   button "Submit" [#submit-btn]
   ```

4. Fill form:
   Tool: fill_form({
     elements: [
       { uid: "#name-input", value: "John Doe" },
       { uid: "#email-input", value: "john@example.com" },
       { uid: "#message-textarea", value: "Hello, I have a question..." }
     ]
   })

5. Submit form:
   Tool: click({ uid: "#submit-btn" })

6. Wait for success message:
   Tool: wait_for({ text: "Message sent successfully", timeout: 5000 })

7. Take screenshot of confirmation:
   Tool: take_screenshot({ filePath: "/tmp/success.png" })

**Agent Response**:
"✅ Form submitted successfully!

**Actions Performed**:
1. Navigated to contact page
2. Filled in:
   - Name: John Doe
   - Email: john@example.com
   - Message: Hello, I have a question...
3. Clicked Submit button
4. Confirmed: 'Message sent successfully' appears

Screenshot saved to: /tmp/success.png"
```

### Example 2: E-commerce Shopping Flow

```markdown
**User Request**: "Add 3 items to cart and proceed to checkout"

**Agent Workflow**:

1. Navigate to product page:
   Tool: navigate_page({ type: "url", url: "https://shop.example.com/products" })

2. For each of 3 products:
   a. Take snapshot to find product elements
   b. Click "Add to Cart" button
   c. Wait for cart count to update

3. Navigate to cart:
   Tool: click({ uid: "#cart-icon" })

4. Verify cart contents:
   Tool: take_snapshot({ verbose: true })
   Tool: evaluate_script({
     function: "document.querySelectorAll('.cart-item').length"
   })

5. Proceed to checkout:
   Tool: click({ uid: "#checkout-btn" })

6. Fill checkout form:
   Tool: fill_form({
     elements: [
       { uid: "#shipping-name", value: "Jane Smith" },
       { uid: "#shipping-address", value: "123 Main St" },
       { uid: "#shipping-city", value: "San Francisco" },
       { uid: "#shipping-zip", value: "94102" }
     ]
   })

7. Handle confirmation dialog:
   Tool: handle_dialog({ action: "accept" })

8. Take final screenshot:
   Tool: take_screenshot({ fullPage: true, filePath: "/tmp/checkout.png" })

**Agent Response**:
"✅ Shopping flow completed!

**Summary**:
- Added 3 items to cart:
  1. Widget A ($29.99)
  2. Gadget B ($49.99)
  3. Tool C ($19.99)
- Total: $99.97
- Shipping info entered
- Proceeded to checkout

Screenshot: /tmp/checkout.png"
```

### Example 3: Multi-Tab Testing

```markdown
**User Request**: "Open 3 different pages and verify they all load correctly"

**Agent Workflow**:

1. Create pages:
   Tool: new_page({ url: "https://example.com/page1" })
   Tool: new_page({ url: "https://example.com/page2" })
   Tool: new_page({ url: "https://example.com/page3" })

2. List all pages:
   Tool: list_pages()

   Response:
   [
     { id: 1, url: "https://example.com/page1", title: "Page 1" },
     { id: 2, url: "https://example.com/page2", title: "Page 2" },
     { id: 3, url: "https://example.com/page3", title: "Page 3" }
   ]

3. For each page:
   a. Select page: select_page({ pageId: X, bringToFront: true })
   b. Wait for content: wait_for({ text: "Loaded", timeout: 5000 })
   c. Check for errors: list_console_messages({ types: ["error"] })
   d. Take screenshot: take_screenshot({ filePath: `/tmp/page${X}.png` })

4. Close extra pages:
   Tool: close_page({ pageId: 2 })
   Tool: close_page({ pageId: 3 })

**Agent Response**:
"✅ Multi-tab test complete!

**Results**:
- Page 1: ✅ Loaded successfully (0 errors)
- Page 2: ✅ Loaded successfully (0 errors)
- Page 3: ⚠️ Loaded with 1 warning: 'Deprecated API usage'

All pages functional. Screenshots saved to /tmp/"
```

---

## Advanced Automation Patterns

### Pattern 1: Infinite Scroll Loader

```javascript
// Scroll to bottom and wait for more content
const loadAllItems = async () => {
  let previousHeight = 0;
  let currentHeight = await evaluate_script({
    function: "document.body.scrollHeight"
  });

  while (currentHeight > previousHeight) {
    // Scroll to bottom
    await evaluate_script({
      function: "window.scrollTo(0, document.body.scrollHeight)"
    });

    // Wait for new content
    await new Promise(resolve => setTimeout(resolve, 2000));

    previousHeight = currentHeight;
    currentHeight = await evaluate_script({
      function: "document.body.scrollHeight"
    });
  }
};
```

### Pattern 2: Autocomplete Selection

```javascript
// Fill input and select from autocomplete dropdown
await fill({ uid: "#search-input", value: "San Francisco" });

// Wait for dropdown to appear
await wait_for({ text: "San Francisco, CA" });

// Press arrow down to highlight first option
await press_key({ key: "ArrowDown" });

// Press enter to select
await press_key({ key: "Enter" });
```

### Pattern 3: File Upload with Validation

```javascript
// Upload file and wait for processing
await upload_file({
  filePath: "/path/to/document.pdf",
  uid: "#file-input"
});

// Wait for upload progress bar to disappear
await evaluate_script({
  function: `
    new Promise(resolve => {
      const checkProgress = setInterval(() => {
        if (!document.querySelector('.upload-progress')) {
          clearInterval(checkProgress);
          resolve();
        }
      }, 100);
    })
  `
});

// Verify upload success
await wait_for({ text: "Upload complete" });
```

### Pattern 4: Drag and Drop List Reordering

```javascript
// Reorder list items
const items = await take_snapshot();

// Move item from position 3 to position 1
await drag({
  from_uid: "#list-item-3",
  to_uid: "#list-item-1"
});

// Verify new order
const newOrder = await evaluate_script({
  function: `
    Array.from(document.querySelectorAll('.list-item'))
      .map(item => item.textContent.trim())
  `
});
```

---

## Testing Patterns

### Pattern 1: Login Flow Test

```javascript
const testLogin = async (credentials) => {
  // Navigate
  await navigate_page({ type: "url", url: "http://app.com/login" });

  // Fill credentials
  await fill_form({
    elements: [
      { uid: "#username", value: credentials.username },
      { uid: "#password", value: credentials.password }
    ]
  });

  // Submit
  await click({ uid: "#login-btn" });

  // Verify success
  await wait_for({ text: "Dashboard", timeout: 5000 });

  // Check for errors
  const errors = await list_console_messages({ types: ["error"] });

  return {
    success: errors.length === 0,
    errors: errors
  };
};
```

### Pattern 2: Responsive Design Test

```javascript
const viewports = [
  { name: "Mobile", width: 375, height: 667 },
  { name: "Tablet", width: 768, height: 1024 },
  { name: "Desktop", width: 1920, height: 1080 }
];

for (const viewport of viewports) {
  await resize_page({ width: viewport.width, height: viewport.height });
  await take_screenshot({
    filePath: `/tmp/${viewport.name}.png`,
    fullPage: true
  });

  // Check for mobile menu
  const snapshot = await take_snapshot();
  // Verify mobile-specific elements appear
}
```

### Pattern 3: Form Validation Test

```javascript
const testFormValidation = async () => {
  // Submit empty form
  await click({ uid: "#submit-btn" });

  // Check for validation messages
  const snapshot = await take_snapshot({ verbose: true });

  // Verify error messages appear
  await wait_for({ text: "Email is required", timeout: 1000 });
  await wait_for({ text: "Password is required", timeout: 1000 });

  // Take screenshot of validation state
  await take_screenshot({ filePath: "/tmp/validation-errors.png" });

  return {
    validationWorking: true
  };
};
```

---

## Best Practices

### 1. Always Take Snapshot Before Interacting

```javascript
// ✅ Good: Get UIDs first
const snapshot = await take_snapshot();
await click({ uid: "#button-from-snapshot" });

// ❌ Bad: Guess element selectors
await click({ uid: "#button" });  // May not work
```

### 2. Use wait_for After Navigation

```javascript
// ✅ Good: Wait for page to load
await navigate_page({ type: "url", url: "http://site.com" });
await wait_for({ text: "Welcome", timeout: 5000 });
await take_snapshot();

// ❌ Bad: Interact immediately
await navigate_page({ type: "url", url: "http://site.com" });
await click({ uid: "#button" });  // May fail if page not loaded
```

### 3. Handle Dialogs Proactively

```javascript
// ✅ Good: Set up handler before triggering dialog
const clickAndHandle = async () => {
  await click({ uid: "#delete-btn" });
  await handle_dialog({ action: "accept" });
};

// ❌ Bad: Dialog may block automation
await click({ uid: "#delete-btn" });
// Browser stuck on unhandled confirm dialog
```

### 4. Use Timeouts Appropriately

```javascript
// ✅ Good: Adjust timeout based on expected load time
await wait_for({ text: "Large dataset loaded", timeout: 30000 });

// ❌ Bad: Default timeout too short for slow operations
await wait_for({ text: "Large dataset loaded" });  // May timeout
```

---

## Related Skills

- `/console-debug` - Debug automation failures
- `/network-debug` - Monitor automation network activity
- `/performance-trace` - Measure automation performance
- `/screenshot-debug` - Visual verification

---

## References

- [Chrome DevTools Protocol](https://chromedevtools.github.io/devtools-protocol/)
- [Puppeteer Documentation](https://pptr.dev/)
- [Chrome DevTools MCP](https://github.com/ChromeDevTools/chrome-devtools-mcp)

---

## Version

- **Skill Version**: 1.0.0
- **MCP Server**: chrome-devtools-mcp@latest
- **Last Updated**: 2026-01-10
- **Maintainer**: The New Fuse Team
