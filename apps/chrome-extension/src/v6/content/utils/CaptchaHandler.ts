/**
 * Fuse Connect v7 - CAPTCHA Handler
 *
 * Detects and attempts to handle common CAPTCHA challenges:
 * - reCAPTCHA v2/v3
 * - hCaptcha
 * - Cloudflare Turnstile
 * - Generic "Verify you are human" prompts
 *
 * Uses human behavior simulation to interact naturally with CAPTCHA elements.
 */

import { humanSimulator } from './HumanBehaviorSimulator.js';

export type CaptchaType =
  | 'recaptcha-v2'
  | 'recaptcha-v3'
  | 'hcaptcha'
  | 'cloudflare-turnstile'
  | 'cloudflare-challenge'
  | 'generic-checkbox'
  | 'unknown';

export interface CaptchaDetectionResult {
  detected: boolean;
  type: CaptchaType | null;
  element: HTMLElement | null;
  iframe: HTMLIFrameElement | null;
  confidence: number;
}

export interface CaptchaBypassResult {
  success: boolean;
  type: CaptchaType | null;
  message: string;
  requiresManualIntervention: boolean;
}

class CaptchaHandler {
  private lastDetection: CaptchaDetectionResult | null = null;
  private bypassAttempts = 0;
  private maxAttempts = 3;

  /**
   * Detect if a CAPTCHA is present on the page
   */
  detectCaptcha(): CaptchaDetectionResult {
    console.log('[CaptchaHandler] Scanning for CAPTCHA challenges...');

    // Check for reCAPTCHA v2
    const recaptchaV2 = this.detectRecaptchaV2();
    if (recaptchaV2.detected) {
      this.lastDetection = recaptchaV2;
      return recaptchaV2;
    }

    // Check for reCAPTCHA v3 (invisible, harder to detect)
    const recaptchaV3 = this.detectRecaptchaV3();
    if (recaptchaV3.detected) {
      this.lastDetection = recaptchaV3;
      return recaptchaV3;
    }

    // Check for hCaptcha
    const hcaptcha = this.detectHCaptcha();
    if (hcaptcha.detected) {
      this.lastDetection = hcaptcha;
      return hcaptcha;
    }

    // Check for Cloudflare Turnstile
    const turnstile = this.detectCloudflareTurnstile();
    if (turnstile.detected) {
      this.lastDetection = turnstile;
      return turnstile;
    }

    // Check for Cloudflare challenge page
    const cfChallenge = this.detectCloudflareChallenge();
    if (cfChallenge.detected) {
      this.lastDetection = cfChallenge;
      return cfChallenge;
    }

    // Check for generic "I'm not a robot" checkboxes
    const genericCheckbox = this.detectGenericVerification();
    if (genericCheckbox.detected) {
      this.lastDetection = genericCheckbox;
      return genericCheckbox;
    }

    return {
      detected: false,
      type: null,
      element: null,
      iframe: null,
      confidence: 0,
    };
  }

  /**
   * Attempt to bypass/solve the detected CAPTCHA using human simulation
   */
  async attemptBypass(): Promise<CaptchaBypassResult> {
    const detection = this.lastDetection || this.detectCaptcha();

    if (!detection.detected) {
      return {
        success: true,
        type: null,
        message: 'No CAPTCHA detected',
        requiresManualIntervention: false,
      };
    }

    if (this.bypassAttempts >= this.maxAttempts) {
      return {
        success: false,
        type: detection.type,
        message: 'Max bypass attempts reached',
        requiresManualIntervention: true,
      };
    }

    this.bypassAttempts++;
    console.log(
      `[CaptchaHandler] Attempting bypass for ${detection.type} (attempt ${this.bypassAttempts}/${this.maxAttempts})`
    );

    try {
      switch (detection.type) {
        case 'recaptcha-v2':
          return await this.bypassRecaptchaV2(detection);
        case 'hcaptcha':
          return await this.bypassHCaptcha(detection);
        case 'cloudflare-turnstile':
          return await this.bypassTurnstile(detection);
        case 'cloudflare-challenge':
          return await this.handleCloudflareChallenge(detection);
        case 'generic-checkbox':
          return await this.bypassGenericCheckbox(detection);
        default:
          return {
            success: false,
            type: detection.type,
            message: 'Unknown CAPTCHA type - manual intervention required',
            requiresManualIntervention: true,
          };
      }
    } catch (error) {
      console.error('[CaptchaHandler] Bypass error:', error);
      return {
        success: false,
        type: detection.type,
        message: `Bypass failed: ${error}`,
        requiresManualIntervention: true,
      };
    }
  }

  /**
   * Wait for CAPTCHA to be solved (by user or automation)
   */
  async waitForCaptchaSolved(timeoutMs: number = 60000): Promise<boolean> {
    const startTime = Date.now();

    while (Date.now() - startTime < timeoutMs) {
      const detection = this.detectCaptcha();

      // Check if CAPTCHA is no longer blocking
      if (!detection.detected) {
        console.log('[CaptchaHandler] CAPTCHA solved or no longer detected');
        this.resetState();
        return true;
      }

      // Check for success indicators
      if (this.checkSuccessIndicators()) {
        console.log('[CaptchaHandler] Success indicator detected');
        this.resetState();
        return true;
      }

      await this.sleep(1000);
    }

    console.log('[CaptchaHandler] Timeout waiting for CAPTCHA solution');
    return false;
  }

  // ============================================
  // DETECTION METHODS
  // ============================================

  private detectRecaptchaV2(): CaptchaDetectionResult {
    // Look for reCAPTCHA iframe
    const iframes = document.querySelectorAll<HTMLIFrameElement>(
      'iframe[src*="recaptcha"], iframe[src*="google.com/recaptcha"]'
    );

    for (const iframe of iframes) {
      if (iframe.src.includes('anchor') || iframe.src.includes('bframe')) {
        // Also look for the checkbox element
        const checkbox = document.querySelector('.g-recaptcha, .recaptcha-checkbox');
        return {
          detected: true,
          type: 'recaptcha-v2',
          element: checkbox as HTMLElement | null,
          iframe,
          confidence: 0.95,
        };
      }
    }

    // Check for grecaptcha object
    if ((window as any).grecaptcha) {
      return {
        detected: true,
        type: 'recaptcha-v2',
        element: document.querySelector('.g-recaptcha') as HTMLElement | null,
        iframe: null,
        confidence: 0.8,
      };
    }

    return { detected: false, type: null, element: null, iframe: null, confidence: 0 };
  }

  private detectRecaptchaV3(): CaptchaDetectionResult {
    // reCAPTCHA v3 is invisible, look for badge
    const badge = document.querySelector('.grecaptcha-badge');

    if (badge) {
      return {
        detected: true,
        type: 'recaptcha-v3',
        element: badge as HTMLElement,
        iframe: null,
        confidence: 0.7,
      };
    }

    return { detected: false, type: null, element: null, iframe: null, confidence: 0 };
  }

  private detectHCaptcha(): CaptchaDetectionResult {
    // Look for hCaptcha iframe
    const iframe = document.querySelector<HTMLIFrameElement>(
      'iframe[src*="hcaptcha"], iframe[src*="hcaptcha.com"]'
    );

    if (iframe) {
      const checkbox = document.querySelector('.h-captcha');
      return {
        detected: true,
        type: 'hcaptcha',
        element: checkbox as HTMLElement | null,
        iframe,
        confidence: 0.95,
      };
    }

    // Check for hcaptcha object
    if ((window as any).hcaptcha) {
      return {
        detected: true,
        type: 'hcaptcha',
        element: document.querySelector('.h-captcha') as HTMLElement | null,
        iframe: null,
        confidence: 0.8,
      };
    }

    return { detected: false, type: null, element: null, iframe: null, confidence: 0 };
  }

  private detectCloudflareTurnstile(): CaptchaDetectionResult {
    // Look for Turnstile iframe
    const iframe = document.querySelector<HTMLIFrameElement>(
      'iframe[src*="challenges.cloudflare.com/turnstile"]'
    );

    if (iframe) {
      return {
        detected: true,
        type: 'cloudflare-turnstile',
        element: iframe.parentElement,
        iframe,
        confidence: 0.95,
      };
    }

    // Look for turnstile container
    const container = document.querySelector('.cf-turnstile');
    if (container) {
      return {
        detected: true,
        type: 'cloudflare-turnstile',
        element: container as HTMLElement,
        iframe: null,
        confidence: 0.85,
      };
    }

    return { detected: false, type: null, element: null, iframe: null, confidence: 0 };
  }

  private detectCloudflareChallenge(): CaptchaDetectionResult {
    // Cloudflare challenge page indicators
    const indicators = [
      document.querySelector('#cf-challenge-running'),
      document.querySelector('.cf-browser-verification'),
      document.querySelector('[data-ray]'),
      document.title.includes('Just a moment'),
      document.title.includes('Checking your browser'),
    ];

    const matchCount = indicators.filter(Boolean).length;

    if (matchCount >= 2) {
      return {
        detected: true,
        type: 'cloudflare-challenge',
        element: document.body,
        iframe: null,
        confidence: 0.9,
      };
    }

    return { detected: false, type: null, element: null, iframe: null, confidence: 0 };
  }

  private detectGenericVerification(): CaptchaDetectionResult {
    // Look for common verification patterns
    const patterns = [
      'verify you are human',
      "i'm not a robot",
      'prove you are not a robot',
      'human verification',
      'security check',
      'bot detection',
    ];

    const bodyText = document.body.innerText.toLowerCase();
    const matchingPattern = patterns.find((p) => bodyText.includes(p));

    if (matchingPattern) {
      // Try to find clickable elements
      const buttons = Array.from(document.querySelectorAll('button, input[type="submit"]'));
      const verifyButton = buttons.find(
        (btn) =>
          btn.textContent?.toLowerCase().includes('verify') ||
          btn.textContent?.toLowerCase().includes('continue') ||
          btn.textContent?.toLowerCase().includes('confirm')
      );

      const checkboxes = document.querySelectorAll('input[type="checkbox"]');

      return {
        detected: true,
        type: 'generic-checkbox',
        element: (verifyButton || checkboxes[0]) as HTMLElement | null,
        iframe: null,
        confidence: 0.6,
      };
    }

    return { detected: false, type: null, element: null, iframe: null, confidence: 0 };
  }

  // ============================================
  // BYPASS METHODS
  // ============================================

  private async bypassRecaptchaV2(detection: CaptchaDetectionResult): Promise<CaptchaBypassResult> {
    console.log('[CaptchaHandler] Attempting reCAPTCHA v2 bypass...');

    // First, try clicking the checkbox if visible
    const checkbox = document.querySelector<HTMLElement>('.recaptcha-checkbox-border');

    if (checkbox && this.isElementVisible(checkbox)) {
      // Add pre-click delay (human thinking time)
      await humanSimulator.thinkingPause();

      // Human-like click
      await humanSimulator.humanClick(checkbox);

      // Wait for response
      await this.sleep(2000);

      // Check if solved
      const stillDetected = this.detectRecaptchaV2();
      if (!stillDetected.detected) {
        return {
          success: true,
          type: 'recaptcha-v2',
          message: 'reCAPTCHA checkbox clicked successfully',
          requiresManualIntervention: false,
        };
      }
    }

    // If image challenge appears, we need manual intervention
    const challengeFrame = document.querySelector<HTMLIFrameElement>(
      'iframe[src*="bframe"], iframe[title*="recaptcha challenge"]'
    );

    if (challengeFrame && this.isElementVisible(challengeFrame)) {
      return {
        success: false,
        type: 'recaptcha-v2',
        message: 'Image challenge detected - manual intervention required',
        requiresManualIntervention: true,
      };
    }

    return {
      success: false,
      type: 'recaptcha-v2',
      message: 'Could not interact with reCAPTCHA',
      requiresManualIntervention: true,
    };
  }

  private async bypassHCaptcha(detection: CaptchaDetectionResult): Promise<CaptchaBypassResult> {
    console.log('[CaptchaHandler] Attempting hCaptcha bypass...');

    // Try to find and click the checkbox
    const checkbox = document.querySelector<HTMLElement>('.hcaptcha-checkbox, #checkbox');

    if (checkbox && this.isElementVisible(checkbox)) {
      await humanSimulator.thinkingPause();
      await humanSimulator.humanClick(checkbox);
      await this.sleep(2000);

      const stillDetected = this.detectHCaptcha();
      if (!stillDetected.detected) {
        return {
          success: true,
          type: 'hcaptcha',
          message: 'hCaptcha checkbox clicked successfully',
          requiresManualIntervention: false,
        };
      }
    }

    return {
      success: false,
      type: 'hcaptcha',
      message: 'hCaptcha requires manual intervention',
      requiresManualIntervention: true,
    };
  }

  private async bypassTurnstile(detection: CaptchaDetectionResult): Promise<CaptchaBypassResult> {
    console.log('[CaptchaHandler] Attempting Cloudflare Turnstile bypass...');

    // Turnstile often auto-solves, just wait
    await this.sleep(3000);

    const stillDetected = this.detectCloudflareTurnstile();
    if (!stillDetected.detected) {
      return {
        success: true,
        type: 'cloudflare-turnstile',
        message: 'Turnstile auto-solved',
        requiresManualIntervention: false,
      };
    }

    // Try clicking the widget
    if (detection.element) {
      await humanSimulator.humanClick(detection.element);
      await this.sleep(2000);
    }

    return {
      success: false,
      type: 'cloudflare-turnstile',
      message: 'Turnstile requires manual intervention',
      requiresManualIntervention: true,
    };
  }

  private async handleCloudflareChallenge(
    detection: CaptchaDetectionResult
  ): Promise<CaptchaBypassResult> {
    console.log('[CaptchaHandler] Cloudflare challenge page detected, waiting...');

    // Cloudflare challenges usually auto-complete
    await this.sleep(5000);

    // Check if we're still on challenge page
    const stillChallenging =
      document.title.includes('Just a moment') || document.querySelector('#cf-challenge-running');

    if (!stillChallenging) {
      return {
        success: true,
        type: 'cloudflare-challenge',
        message: 'Cloudflare challenge passed',
        requiresManualIntervention: false,
      };
    }

    return {
      success: false,
      type: 'cloudflare-challenge',
      message: 'Cloudflare challenge requires patience or manual intervention',
      requiresManualIntervention: true,
    };
  }

  private async bypassGenericCheckbox(
    detection: CaptchaDetectionResult
  ): Promise<CaptchaBypassResult> {
    console.log('[CaptchaHandler] Attempting generic verification bypass...');

    if (detection.element) {
      await humanSimulator.thinkingPause();
      await humanSimulator.humanClick(detection.element);
      await this.sleep(1500);

      return {
        success: true,
        type: 'generic-checkbox',
        message: 'Clicked verification element',
        requiresManualIntervention: false,
      };
    }

    return {
      success: false,
      type: 'generic-checkbox',
      message: 'No clickable verification element found',
      requiresManualIntervention: true,
    };
  }

  // ============================================
  // HELPERS
  // ============================================

  private checkSuccessIndicators(): boolean {
    // Check for success checkmarks
    const successIndicators = [
      document.querySelector('.recaptcha-checkbox-checked'),
      document.querySelector('[data-success="true"]'),
      document.querySelector('.success-icon'),
    ];

    return successIndicators.some((el) => el !== null);
  }

  private isElementVisible(element: HTMLElement): boolean {
    const rect = element.getBoundingClientRect();
    const style = window.getComputedStyle(element);

    return (
      rect.width > 0 &&
      rect.height > 0 &&
      style.display !== 'none' &&
      style.visibility !== 'hidden' &&
      style.opacity !== '0'
    );
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private resetState(): void {
    this.bypassAttempts = 0;
    this.lastDetection = null;
  }
}

// Export singleton
export const captchaHandler = new CaptchaHandler();
