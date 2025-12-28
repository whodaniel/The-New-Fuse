# Fuse Connect v6 - CAPTCHA Handler API Documentation

## Overview

The CAPTCHA Handler is a new feature in Fuse Connect v6 that provides automatic
detection and bypass capabilities for common CAPTCHA challenges. It works in
conjunction with the Human Behavior Simulator to interact naturally with CAPTCHA
elements.

## Supported CAPTCHA Types

| Type                  | Detection Confidence | Auto-Bypass Support      |
| --------------------- | -------------------- | ------------------------ |
| reCAPTCHA v2          | 95%                  | ✅ Checkbox click        |
| reCAPTCHA v3          | 70%                  | ⚠️ Invisible, limited    |
| hCaptcha              | 95%                  | ✅ Checkbox click        |
| Cloudflare Turnstile  | 95%                  | ✅ Auto-wait + click     |
| Cloudflare Challenge  | 90%                  | ⏳ Wait for auto-solve   |
| Generic "Not a Robot" | 60%                  | ✅ Button/checkbox click |

**Note:** Image-based challenges (select all traffic lights, etc.) require
manual intervention.

---

## API Reference

### Message Types

#### `DETECT_CAPTCHA`

Detects if a CAPTCHA is present on the current page.

**Request:**

```javascript
chrome.tabs.sendMessage(tabId, { type: 'DETECT_CAPTCHA' }, (response) => {
  console.log(response);
});
```

**Response:**

```typescript
interface CaptchaDetectionResult {
  detected: boolean; // True if CAPTCHA found
  type: CaptchaType | null; // 'recaptcha-v2', 'hcaptcha', etc.
  element: HTMLElement | null; // Reference to CAPTCHA element
  iframe: HTMLIFrameElement | null; // CAPTCHA iframe if present
  confidence: number; // 0.0 - 1.0 confidence score
}
```

**Example Response:**

```json
{
  "detected": true,
  "type": "recaptcha-v2",
  "confidence": 0.95,
  "element": "[HTMLElement]",
  "iframe": "[HTMLIFrameElement]"
}
```

---

#### `BYPASS_CAPTCHA`

Attempts to bypass the detected CAPTCHA using human behavior simulation.

**Request:**

```javascript
chrome.tabs.sendMessage(tabId, { type: 'BYPASS_CAPTCHA' }, (response) => {
  console.log(response);
});
```

**Response:**

```typescript
interface CaptchaBypassResult {
  success: boolean; // True if bypassed
  type: CaptchaType | null; // CAPTCHA type attempted
  message: string; // Status message
  requiresManualIntervention: boolean; // True if user must solve
}
```

**Example Responses:**

_Success:_

```json
{
  "success": true,
  "type": "recaptcha-v2",
  "message": "reCAPTCHA checkbox clicked successfully",
  "requiresManualIntervention": false
}
```

_Manual Required:_

```json
{
  "success": false,
  "type": "recaptcha-v2",
  "message": "Image challenge detected - manual intervention required",
  "requiresManualIntervention": true
}
```

---

#### `WAIT_FOR_CAPTCHA`

Waits for a CAPTCHA to be solved (by user or automation).

**Request:**

```javascript
chrome.tabs.sendMessage(
  tabId,
  {
    type: 'WAIT_FOR_CAPTCHA',
    timeout: 60000, // Optional, default 60 seconds
  },
  (response) => {
    console.log(response);
  }
);
```

**Response:**

```json
{
  "solved": true // or false if timeout
}
```

---

## Usage Examples

### Example 1: Detect and Bypass Flow

```javascript
// From popup or background script
async function handleCaptcha(tabId) {
  // Step 1: Detect CAPTCHA
  const detection = await sendMessage(tabId, { type: 'DETECT_CAPTCHA' });

  if (!detection.detected) {
    console.log('No CAPTCHA detected');
    return { success: true };
  }

  console.log(
    `Found ${detection.type} with ${detection.confidence * 100}% confidence`
  );

  // Step 2: Attempt bypass
  const bypass = await sendMessage(tabId, { type: 'BYPASS_CAPTCHA' });

  if (bypass.success) {
    console.log('CAPTCHA bypassed automatically!');
    return { success: true };
  }

  if (bypass.requiresManualIntervention) {
    console.log('Waiting for user to solve CAPTCHA...');

    // Step 3: Wait for manual solution
    const solved = await sendMessage(tabId, {
      type: 'WAIT_FOR_CAPTCHA',
      timeout: 120000, // 2 minutes
    });

    return { success: solved.solved };
  }

  return { success: false };
}

// Helper function
function sendMessage(tabId, message) {
  return new Promise((resolve) => {
    chrome.tabs.sendMessage(tabId, message, resolve);
  });
}
```

### Example 2: Agent Automation Flow

```javascript
// In an agent that needs to navigate a CAPTCHA-protected site
async function automateWithCaptcha(url) {
  // Navigate to page
  await navigateToUrl(url);
  await waitForPageLoad();

  // Check for CAPTCHA
  const captchaStatus = await detectCaptcha();

  if (captchaStatus.detected) {
    console.log(`CAPTCHA detected: ${captchaStatus.type}`);

    // Try automatic bypass
    const result = await bypassCaptcha();

    if (!result.success && result.requiresManualIntervention) {
      // Notify user
      await showNotification(
        'Manual CAPTCHA Required',
        'Please solve the CAPTCHA to continue automation'
      );

      // Wait up to 2 minutes
      const solved = await waitForCaptcha(120000);

      if (!solved) {
        throw new Error('CAPTCHA not solved within timeout');
      }
    }
  }

  // Continue with automation
  await continueAutomation();
}
```

---

## Detection Techniques

### reCAPTCHA v2

- Looks for iframes with `src*="recaptcha"` or `src*="google.com/recaptcha"`
- Checks for `.g-recaptcha` or `.recaptcha-checkbox` elements
- Detects `window.grecaptcha` object

### hCaptcha

- Looks for iframes with `src*="hcaptcha.com"`
- Checks for `.h-captcha` container
- Detects `window.hcaptcha` object

### Cloudflare Turnstile

- Looks for iframes with `src*="challenges.cloudflare.com/turnstile"`
- Checks for `.cf-turnstile` container

### Cloudflare Challenge

- Detects `#cf-challenge-running` element
- Checks for `.cf-browser-verification`
- Looks for `[data-ray]` attribute
- Checks page title for "Just a moment" or "Checking your browser"

### Generic Verification

- Scans page text for patterns:
  - "verify you are human"
  - "i'm not a robot"
  - "prove you are not a robot"
  - "human verification"
  - "security check"
  - "bot detection"

---

## Bypass Strategies

### Checkbox-based CAPTCHAs (reCAPTCHA v2, hCaptcha)

1. Use `humanSimulator.thinkingPause()` for natural timing
2. Apply `humanSimulator.humanClick()` with Bezier curve mouse movement
3. Wait for response
4. If image challenge appears → requires manual intervention

### Cloudflare Turnstile

1. Wait 3 seconds for auto-solve
2. If still present, attempt human click on widget
3. Usually auto-solves after browser fingerprint check

### Cloudflare Challenge Page

1. Wait 5 seconds for JavaScript challenge to complete
2. Page should auto-redirect when solved
3. Usually requires no user interaction

---

## Integration with Human Behavior Simulator

The CAPTCHA Handler uses these `HumanBehaviorSimulator` methods:

```typescript
// Natural timing delay before clicking
await humanSimulator.thinkingPause(); // 500-2000ms

// Human-like click with mouse movement
await humanSimulator.humanClick(element, {
  moveFirst: true, // Move mouse to element first
  prePauseMin: 50, // Min pause before click
  prePauseMax: 150, // Max pause before click
  postPauseMin: 50, // Min pause after click
  postPauseMax: 200, // Max pause after click
});
```

---

## Limitations

1. **Image Challenges** - Cannot solve image-based challenges (select all buses,
   etc.)
2. **Invisible reCAPTCHA v3** - Scores based on behavior, limited bypass
   capability
3. **Advanced Bot Detection** - Some sites use additional fingerprinting beyond
   CAPTCHA
4. **Rate Limiting** - Multiple bypass attempts may trigger stricter challenges

---

## Best Practices

1. **Don't Abuse** - Use for legitimate automation only
2. **Add Natural Delays** - Don't immediately attempt bypass after page load
3. **Handle Failures Gracefully** - Always have a fallback for manual
   intervention
4. **Respect Limits** - Stop after 3 failed attempts (built-in limit)

---

## Changelog

### v6.0.0 (December 25, 2024)

- Initial CAPTCHA Handler implementation
- Support for reCAPTCHA v2/v3, hCaptcha, Cloudflare Turnstile
- Integration with HumanBehaviorSimulator
- New message types: DETECT_CAPTCHA, BYPASS_CAPTCHA, WAIT_FOR_CAPTCHA
