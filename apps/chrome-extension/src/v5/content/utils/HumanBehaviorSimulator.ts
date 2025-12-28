/**
 * Fuse Connect v6 - Human Behavior Simulator
 *
 * Implements techniques to make browser automation appear more human-like:
 * - Randomized timing and delays
 * - Realistic mouse movements with Bezier curves
 * - Natural typing with variable speed and occasional typos
 * - Human-like scrolling patterns
 * - Session management helpers
 *
 * Based on 2024 best practices for bypassing bot detection.
 */

interface MousePosition {
  x: number;
  y: number;
}

interface TypingOptions {
  minDelay?: number;
  maxDelay?: number;
  typoChance?: number;
  correctTypos?: boolean;
  pauseOnPunctuation?: boolean;
}

interface ScrollOptions {
  duration?: number;
  easing?: 'linear' | 'easeInOut' | 'human';
  addNoise?: boolean;
}

interface ClickOptions {
  moveFirst?: boolean;
  moveDuration?: number;
  prePauseMin?: number;
  prePauseMax?: number;
  postPauseMin?: number;
  postPauseMax?: number;
}

export class HumanBehaviorSimulator {
  private lastMousePosition: MousePosition = { x: 0, y: 0 };
  private isMoving = false;

  constructor() {
    // Track actual mouse position when available
    document.addEventListener('mousemove', (e) => {
      if (!this.isMoving) {
        this.lastMousePosition = { x: e.clientX, y: e.clientY };
      }
    });
  }

  // ============================================
  // TIMING & DELAYS
  // ============================================

  /**
   * Wait for a random duration within a range (human-like variance)
   */
  async randomDelay(minMs: number, maxMs: number): Promise<void> {
    const delay = this.randomBetween(minMs, maxMs);
    await this.sleep(delay);
  }

  /**
   * Human-like delay with natural distribution (more likely to be near middle)
   */
  async humanDelay(baseMs: number = 500): Promise<void> {
    // Use gaussian-like distribution
    const variance = baseMs * 0.4;
    const delay = this.gaussianRandom(baseMs, variance);
    await this.sleep(Math.max(50, delay));
  }

  /**
   * Add micro-delays between actions (100-500ms)
   */
  async microPause(): Promise<void> {
    await this.randomDelay(100, 500);
  }

  /**
   * Add thinking pause (500-2000ms, like a human reading/thinking)
   */
  async thinkingPause(): Promise<void> {
    await this.randomDelay(500, 2000);
  }

  // ============================================
  // MOUSE MOVEMENTS
  // ============================================

  /**
   * Move mouse to target using Bezier curve (natural movement)
   */
  async moveMouse(
    target: MousePosition,
    options?: { duration?: number; steps?: number }
  ): Promise<void> {
    const duration = options?.duration ?? this.randomBetween(200, 500);
    const steps = options?.steps ?? Math.max(10, Math.floor(duration / 16));

    const start = { ...this.lastMousePosition };
    const controlPoints = this.generateBezierControlPoints(start, target);

    this.isMoving = true;

    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const point = this.bezierPoint(t, start, controlPoints[0], controlPoints[1], target);

      // Add slight noise to make movement less perfect
      const noise = this.randomBetween(-2, 2);
      const noisyPoint = {
        x: point.x + noise,
        y: point.y + noise,
      };

      // Dispatch mouse move event
      this.dispatchMouseEvent('mousemove', noisyPoint);

      this.lastMousePosition = noisyPoint;
      await this.sleep(duration / steps);
    }

    this.isMoving = false;
  }

  /**
   * Move to element with human-like behavior
   */
  async moveToElement(element: HTMLElement): Promise<void> {
    const rect = element.getBoundingClientRect();

    // Aim for a random point within the element (not always center)
    const targetX = rect.left + this.randomBetween(rect.width * 0.2, rect.width * 0.8);
    const targetY = rect.top + this.randomBetween(rect.height * 0.2, rect.height * 0.8);

    await this.moveMouse({ x: targetX, y: targetY });
  }

  /**
   * Human-like click with optional movement first
   */
  async humanClick(element: HTMLElement, options: ClickOptions = {}): Promise<void> {
    const {
      moveFirst = true,
      prePauseMin = 50,
      prePauseMax = 150,
      postPauseMin = 50,
      postPauseMax = 200,
    } = options;

    // Move to element first (like a human would)
    if (moveFirst) {
      await this.moveToElement(element);
      await this.randomDelay(prePauseMin, prePauseMax);
    }

    const rect = element.getBoundingClientRect();
    const clickX = rect.left + rect.width / 2;
    const clickY = rect.top + rect.height / 2;

    // Dispatch mousedown, mouseup, click sequence
    this.dispatchMouseEvent('mousedown', { x: clickX, y: clickY }, element);
    await this.sleep(this.randomBetween(50, 120)); // Hold duration
    this.dispatchMouseEvent('mouseup', { x: clickX, y: clickY }, element);
    this.dispatchMouseEvent('click', { x: clickX, y: clickY }, element);

    await this.randomDelay(postPauseMin, postPauseMax);
  }

  /**
   * Double click with human timing
   */
  async humanDoubleClick(element: HTMLElement): Promise<void> {
    await this.humanClick(element, { postPauseMin: 50, postPauseMax: 150 });
    await this.humanClick(element, { moveFirst: false });

    this.dispatchMouseEvent('dblclick', this.lastMousePosition, element);
  }

  // ============================================
  // TYPING SIMULATION
  // ============================================

  /**
   * Type text with human-like speed and optional typos
   */
  async humanType(
    element: HTMLElement | HTMLInputElement | HTMLTextAreaElement,
    text: string,
    options: TypingOptions = {}
  ): Promise<void> {
    const {
      minDelay = 50,
      maxDelay = 150,
      typoChance = 0.02, // 2% chance of typo
      correctTypos = true,
      pauseOnPunctuation = true,
    } = options;

    // Focus the element first
    element.focus();
    await this.microPause();

    const punctuation = ['.', ',', '!', '?', ';', ':'];

    for (let i = 0; i < text.length; i++) {
      const char = text[i];

      // Occasionally make a typo and correct it
      if (typoChance > 0 && Math.random() < typoChance && correctTypos) {
        const nearbyKeys = this.getNearbyKeys(char);
        if (nearbyKeys.length > 0) {
          const typoChar = nearbyKeys[Math.floor(Math.random() * nearbyKeys.length)];
          await this.typeCharacter(element, typoChar);
          await this.randomDelay(100, 300);
          await this.typeBackspace(element);
          await this.randomDelay(50, 150);
        }
      }

      // Type the actual character
      await this.typeCharacter(element, char);

      // Variable delay between keystrokes
      let delay = this.randomBetween(minDelay, maxDelay);

      // Longer pause after punctuation (thinking time)
      if (pauseOnPunctuation && punctuation.includes(char)) {
        delay += this.randomBetween(100, 400);
      }

      // Occasional longer pauses (like thinking)
      if (Math.random() < 0.05) {
        delay += this.randomBetween(200, 600);
      }

      await this.sleep(delay);
    }
  }

  /**
   * Type a single character with proper events
   */
  private async typeCharacter(element: HTMLElement, char: string): Promise<void> {
    const keyCode = char.charCodeAt(0);

    // Dispatch key events
    element.dispatchEvent(
      new KeyboardEvent('keydown', {
        key: char,
        code: `Key${char.toUpperCase()}`,
        keyCode,
        which: keyCode,
        bubbles: true,
        cancelable: true,
      })
    );

    element.dispatchEvent(
      new KeyboardEvent('keypress', {
        key: char,
        code: `Key${char.toUpperCase()}`,
        keyCode,
        which: keyCode,
        bubbles: true,
        cancelable: true,
      })
    );

    // Update input value
    if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
      element.value += char;
      element.dispatchEvent(new Event('input', { bubbles: true }));
    } else if (element.getAttribute('contenteditable') === 'true') {
      // For contenteditable, insert text at cursor
      document.execCommand('insertText', false, char);
    }

    element.dispatchEvent(
      new KeyboardEvent('keyup', {
        key: char,
        code: `Key${char.toUpperCase()}`,
        keyCode,
        which: keyCode,
        bubbles: true,
        cancelable: true,
      })
    );
  }

  /**
   * Type backspace
   */
  private async typeBackspace(element: HTMLElement): Promise<void> {
    element.dispatchEvent(
      new KeyboardEvent('keydown', {
        key: 'Backspace',
        code: 'Backspace',
        keyCode: 8,
        which: 8,
        bubbles: true,
        cancelable: true,
      })
    );

    if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
      element.value = element.value.slice(0, -1);
      element.dispatchEvent(new Event('input', { bubbles: true }));
    } else if (element.getAttribute('contenteditable') === 'true') {
      document.execCommand('delete', false);
    }

    element.dispatchEvent(
      new KeyboardEvent('keyup', {
        key: 'Backspace',
        code: 'Backspace',
        keyCode: 8,
        which: 8,
        bubbles: true,
        cancelable: true,
      })
    );
  }

  // ============================================
  // SCROLLING
  // ============================================

  /**
   * Human-like scroll to position
   */
  async humanScroll(target: number | HTMLElement, options: ScrollOptions = {}): Promise<void> {
    const { duration = 800, easing = 'human', addNoise = true } = options;

    const startY = window.scrollY;
    let endY: number;

    if (typeof target === 'number') {
      endY = target;
    } else {
      const rect = target.getBoundingClientRect();
      endY = startY + rect.top - window.innerHeight / 3; // Scroll element to upper third
    }

    const distance = endY - startY;
    const startTime = performance.now();

    return new Promise((resolve) => {
      const step = () => {
        const elapsed = performance.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);

        let easedProgress: number;
        switch (easing) {
          case 'linear':
            easedProgress = progress;
            break;
          case 'easeInOut':
            easedProgress = this.easeInOutCubic(progress);
            break;
          case 'human':
          default:
            // Human scrolling is usually fast start, slow end
            easedProgress = this.humanEasing(progress);
            break;
        }

        let scrollY = startY + distance * easedProgress;

        // Add slight noise to make scrolling less mechanical
        if (addNoise && progress < 1) {
          scrollY += this.randomBetween(-3, 3);
        }

        window.scrollTo(0, scrollY);

        if (progress < 1) {
          requestAnimationFrame(step);
        } else {
          // Small pause after scrolling (like reading)
          setTimeout(resolve, this.randomBetween(100, 300));
        }
      };

      requestAnimationFrame(step);
    });
  }

  /**
   * Scroll like reading a page (down in steps)
   */
  async readingScroll(stepHeight: number = 300, pauseMs: number = 1000): Promise<void> {
    const pageHeight = document.documentElement.scrollHeight;
    const viewHeight = window.innerHeight;
    let currentY = window.scrollY;

    while (currentY + viewHeight < pageHeight) {
      const scrollAmount = stepHeight + this.randomBetween(-50, 100);
      await this.humanScroll(currentY + scrollAmount);
      currentY = window.scrollY;
      await this.randomDelay(pauseMs * 0.5, pauseMs * 1.5);
    }
  }

  // ============================================
  // ANTI-DETECTION HELPERS
  // ============================================

  /**
   * Mask navigator.webdriver property
   */
  maskWebdriverProperty(): void {
    try {
      Object.defineProperty(navigator, 'webdriver', {
        get: () => undefined,
        configurable: true,
      });
    } catch (e) {
      console.warn('[HumanSimulator] Could not mask webdriver property:', e);
    }
  }

  /**
   * Generate realistic user agent rotation
   */
  getRandomUserAgent(): string {
    const userAgents = [
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
    ];
    return userAgents[Math.floor(Math.random() * userAgents.length)];
  }

  /**
   * Add realistic browser plugins/languages to mimic real user
   */
  getRealisticBrowserProfile(): Record<string, unknown> {
    return {
      screenWidth: [1920, 1680, 1440, 1366, 1280][Math.floor(Math.random() * 5)],
      screenHeight: [1080, 1050, 900, 768][Math.floor(Math.random() * 4)],
      colorDepth: 24,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      language: navigator.language,
      platform: navigator.platform,
      doNotTrack: Math.random() > 0.5 ? '1' : null,
      hardwareConcurrency: [4, 8, 12, 16][Math.floor(Math.random() * 4)],
    };
  }

  // ============================================
  // PRIVATE HELPERS
  // ============================================

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private randomBetween(min: number, max: number): number {
    return Math.random() * (max - min) + min;
  }

  private gaussianRandom(mean: number, stdev: number): number {
    const u1 = Math.random();
    const u2 = Math.random();
    const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    return z * stdev + mean;
  }

  private generateBezierControlPoints(
    start: MousePosition,
    end: MousePosition
  ): [MousePosition, MousePosition] {
    const dx = end.x - start.x;
    const dy = end.y - start.y;

    // Control points create a slight curve
    const cp1: MousePosition = {
      x: start.x + dx * 0.3 + this.randomBetween(-30, 30),
      y: start.y + dy * 0.1 + this.randomBetween(-30, 30),
    };

    const cp2: MousePosition = {
      x: start.x + dx * 0.7 + this.randomBetween(-30, 30),
      y: start.y + dy * 0.9 + this.randomBetween(-30, 30),
    };

    return [cp1, cp2];
  }

  private bezierPoint(
    t: number,
    p0: MousePosition,
    p1: MousePosition,
    p2: MousePosition,
    p3: MousePosition
  ): MousePosition {
    const t2 = t * t;
    const t3 = t2 * t;
    const mt = 1 - t;
    const mt2 = mt * mt;
    const mt3 = mt2 * mt;

    return {
      x: mt3 * p0.x + 3 * mt2 * t * p1.x + 3 * mt * t2 * p2.x + t3 * p3.x,
      y: mt3 * p0.y + 3 * mt2 * t * p1.y + 3 * mt * t2 * p2.y + t3 * p3.y,
    };
  }

  private dispatchMouseEvent(type: string, position: MousePosition, target?: HTMLElement): void {
    const event = new MouseEvent(type, {
      bubbles: true,
      cancelable: true,
      clientX: position.x,
      clientY: position.y,
      view: window,
    });

    (target || document.elementFromPoint(position.x, position.y) || document.body).dispatchEvent(
      event
    );
  }

  private easeInOutCubic(t: number): number {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  private humanEasing(t: number): number {
    // Fast start, gradual slowdown (like real scrolling)
    return 1 - Math.pow(1 - t, 3);
  }

  private getNearbyKeys(char: string): string[] {
    const keyboard: Record<string, string[]> = {
      q: ['w', 'a'],
      w: ['q', 'e', 's'],
      e: ['w', 'r', 'd'],
      r: ['e', 't', 'f'],
      t: ['r', 'y', 'g'],
      y: ['t', 'u', 'h'],
      u: ['y', 'i', 'j'],
      i: ['u', 'o', 'k'],
      o: ['i', 'p', 'l'],
      p: ['o', 'l'],
      a: ['q', 's', 'z'],
      s: ['a', 'w', 'd', 'x'],
      d: ['s', 'e', 'f', 'c'],
      f: ['d', 'r', 'g', 'v'],
      g: ['f', 't', 'h', 'b'],
      h: ['g', 'y', 'j', 'n'],
      j: ['h', 'u', 'k', 'm'],
      k: ['j', 'i', 'l'],
      l: ['k', 'o', 'p'],
      z: ['a', 'x'],
      x: ['z', 's', 'c'],
      c: ['x', 'd', 'v'],
      v: ['c', 'f', 'b'],
      b: ['v', 'g', 'n'],
      n: ['b', 'h', 'm'],
      m: ['n', 'j'],
    };
    return keyboard[char.toLowerCase()] || [];
  }
}

// Export singleton
export const humanSimulator = new HumanBehaviorSimulator();
