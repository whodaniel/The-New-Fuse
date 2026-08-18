/**
 * Fuse Connect v7 - Agent Visual Indicator
 * Shows glowing border and stop button when an agent is active on the page
 * Inspired by Claude extension's agent-visual-indicator.js
 */

interface IndicatorState {
  isGlowActive: boolean;
  isStaticActive: boolean;
  glowContainer: HTMLElement | null;
  stopContainer: HTMLElement | null;
  staticIndicator: HTMLElement | null;
  heartbeatInterval: ReturnType<typeof setInterval> | null;
  wasGlowVisible: boolean;
  wasStaticVisible: boolean;
}

const FUSE_ORANGE = '#FF6B35';
const FUSE_CYAN = '#00D9FF';
const FUSE_PURPLE = '#9D4EDD';

export class AgentVisualIndicator {
  private state: IndicatorState = {
    isGlowActive: false,
    isStaticActive: false,
    glowContainer: null,
    stopContainer: null,
    staticIndicator: null,
    heartbeatInterval: null,
    wasGlowVisible: false,
    wasStaticVisible: false,
  };

  constructor() {
    this.setupMessageListener();
    window.addEventListener('beforeunload', () => this.cleanup());
  }

  /**
   * Show the active agent indicator (glowing border + stop button)
   */
  showAgentActive(): void {
    this.state.isGlowActive = true;
    this.injectAnimationStyles();
    this.createGlowBorder();
    this.createStopButton();
    this.animateIn();
  }

  /**
   * Hide the active agent indicator
   */
  hideAgentActive(): void {
    if (!this.state.isGlowActive) return;

    this.state.isGlowActive = false;
    this.animateOut();

    setTimeout(() => {
      if (!this.state.isGlowActive) {
        this.removeGlowBorder();
        this.removeStopButton();
      }
    }, 300);
  }

  /**
   * Show static indicator (for tab groups or persistent state)
   */
  showStaticIndicator(): void {
    this.state.isStaticActive = true;
    this.createStaticIndicator();
    this.startHeartbeat();
  }

  /**
   * Hide static indicator
   */
  hideStaticIndicator(): void {
    this.state.isStaticActive = false;
    this.stopHeartbeat();
    this.removeStaticIndicator();
  }

  /**
   * Temporarily hide for tool use (screenshots, etc.)
   */
  hideForToolUse(): void {
    this.state.wasGlowVisible = this.state.isGlowActive;
    this.state.wasStaticVisible = this.state.isStaticActive;

    if (this.state.glowContainer) {
      this.state.glowContainer.style.display = 'none';
    }
    if (this.state.stopContainer) {
      this.state.stopContainer.style.display = 'none';
    }
    if (this.state.staticIndicator) {
      this.state.staticIndicator.style.display = 'none';
    }
  }

  /**
   * Restore after tool use
   */
  showAfterToolUse(): void {
    if (this.state.wasGlowVisible) {
      if (this.state.glowContainer) {
        this.state.glowContainer.style.display = '';
      }
      if (this.state.stopContainer) {
        this.state.stopContainer.style.display = '';
      }
    }
    if (this.state.wasStaticVisible && this.state.staticIndicator) {
      this.state.staticIndicator.style.display = '';
    }
    this.state.wasGlowVisible = false;
    this.state.wasStaticVisible = false;
  }

  /**
   * Inject animation styles
   */
  private injectAnimationStyles(): void {
    if (document.getElementById('fuse-agent-animation-styles')) return;

    const style = document.createElement('style');
    style.id = 'fuse-agent-animation-styles';
    style.textContent = `
      @keyframes fuse-pulse {
        0% {
          box-shadow:
            inset 0 0 10px rgba(0, 217, 255, 0.5),
            inset 0 0 20px rgba(157, 78, 221, 0.3),
            inset 0 0 30px rgba(0, 217, 255, 0.1);
        }
        50% {
          box-shadow:
            inset 0 0 15px rgba(0, 217, 255, 0.7),
            inset 0 0 25px rgba(157, 78, 221, 0.5),
            inset 0 0 35px rgba(0, 217, 255, 0.2);
        }
        100% {
          box-shadow:
            inset 0 0 10px rgba(0, 217, 255, 0.5),
            inset 0 0 20px rgba(157, 78, 221, 0.3),
            inset 0 0 30px rgba(0, 217, 255, 0.1);
        }
      }

      @keyframes fuse-spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `;
    document.head.appendChild(style);
  }

  /**
   * Create glowing border
   */
  private createGlowBorder(): void {
    if (this.state.glowContainer) {
      this.state.glowContainer.style.display = '';
      return;
    }

    const container = document.createElement('div');
    container.id = 'fuse-agent-glow-border';
    container.style.cssText = `
      position: fixed !important;
      top: 0 !important;
      left: 0 !important;
      right: 0 !important;
      bottom: 0 !important;
      pointer-events: none !important;
      z-index: 2147483646 !important;
      opacity: 0 !important;
      transition: opacity 0.3s ease-in-out !important;
      animation: fuse-pulse 2s ease-in-out infinite !important;
      box-shadow:
        inset 0 0 10px rgba(0, 217, 255, 0.5),
        inset 0 0 20px rgba(157, 78, 221, 0.3),
        inset 0 0 30px rgba(0, 217, 255, 0.1) !important;
    `;

    document.body.appendChild(container);
    this.state.glowContainer = container;
  }

  /**
   * Create stop button
   */
  private createStopButton(): void {
    if (this.state.stopContainer) {
      this.state.stopContainer.style.display = '';
      return;
    }

    const container = document.createElement('div');
    container.id = 'fuse-agent-stop-container';
    container.style.cssText = `
      position: fixed !important;
      bottom: 16px !important;
      left: 50% !important;
      transform: translateX(-50%) !important;
      display: flex !important;
      justify-content: center !important;
      align-items: center !important;
      pointer-events: none !important;
      z-index: 2147483647 !important;
    `;

    const button = document.createElement('button');
    button.id = 'fuse-agent-stop-button';
    button.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 256 256" fill="currentColor" style="margin-right: 12px; vertical-align: middle;">
        <path d="M128,20A108,108,0,1,0,236,128,108.12,108.12,0,0,0,128,20Zm0,192a84,84,0,1,1,84-84A84.09,84.09,0,0,1,128,212Zm40-112v56a12,12,0,0,1-12,12H100a12,12,0,0,1-12-12V100a12,12,0,0,1,12-12h56A12,12,0,0,1,168,100Z"></path>
      </svg>
      <span style="vertical-align: middle;">Stop Agent</span>
    `;
    button.style.cssText = `
      position: relative !important;
      transform: translateY(100px) !important;
      padding: 12px 16px !important;
      background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%) !important;
      color: #fff !important;
      border: 1px solid rgba(0, 217, 255, 0.4) !important;
      border-radius: 12px !important;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif !important;
      font-size: 14px !important;
      font-weight: 600 !important;
      cursor: pointer !important;
      display: inline-flex !important;
      align-items: center !important;
      justify-content: center !important;
      box-shadow:
        0 40px 80px rgba(0, 217, 255, 0.24),
        0 4px 14px rgba(157, 78, 221, 0.24) !important;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
      opacity: 0 !important;
      user-select: none !important;
      pointer-events: auto !important;
      white-space: nowrap !important;
      margin: 0 auto !important;
    `;

    button.addEventListener('mouseenter', () => {
      if (this.state.isGlowActive) {
        button.style.background = 'linear-gradient(135deg, #0f3460 0%, #16213e 100%)';
        button.style.boxShadow =
          '0 40px 80px rgba(0, 217, 255, 0.4), 0 4px 14px rgba(157, 78, 221, 0.4)';
        button.style.borderColor = 'rgba(0, 217, 255, 0.8)';
      }
    });

    button.addEventListener('mouseleave', () => {
      if (this.state.isGlowActive) {
        button.style.background = 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)';
        button.style.boxShadow =
          '0 40px 80px rgba(0, 217, 255, 0.24), 0 4px 14px rgba(157, 78, 221, 0.24)';
        button.style.borderColor = 'rgba(0, 217, 255, 0.4)';
      }
    });

    button.addEventListener('click', async () => {
      try {
        await chrome.runtime.sendMessage({ type: 'STOP_AGENT', source: 'visual-indicator' });
      } catch (e) {
        console.error('[FuseConnect] Error sending stop message:', e);
      }
    });

    container.appendChild(button);
    document.body.appendChild(container);
    this.state.stopContainer = container;
  }

  /**
   * Create static indicator
   */
  private createStaticIndicator(): void {
    if (this.state.staticIndicator) {
      this.state.staticIndicator.style.display = '';
      return;
    }

    const container = document.createElement('div');
    container.id = 'fuse-static-indicator';
    container.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="${FUSE_CYAN}" stroke-width="2" style="margin-right: 8px; vertical-align: middle; animation: fuse-spin 2s linear infinite;">
        <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
      </svg>
      <span style="vertical-align: middle; color: #fff; font-size: 14px;">Fuse Agent active</span>
      <div style="display: inline-block; width: 1px; height: 24px; background: rgba(255,255,255,0.2); margin: 0 12px; vertical-align: middle;"></div>
      <button id="fuse-static-open-btn" style="background: transparent; border: none; color: ${FUSE_CYAN}; cursor: pointer; padding: 4px 8px; font-size: 12px; border-radius: 4px; transition: background 0.2s;">
        Open Panel
      </button>
      <button id="fuse-static-dismiss-btn" style="background: transparent; border: none; color: rgba(255,255,255,0.6); cursor: pointer; padding: 4px 8px; font-size: 12px; border-radius: 4px; transition: background 0.2s;">
        ✕
      </button>
    `;
    container.style.cssText = `
      position: fixed !important;
      bottom: 16px !important;
      left: 50% !important;
      transform: translateX(-50%) !important;
      display: inline-flex !important;
      align-items: center !important;
      justify-content: center !important;
      padding: 8px 16px !important;
      background: linear-gradient(135deg, rgba(26, 26, 46, 0.95) 0%, rgba(22, 33, 62, 0.95) 100%) !important;
      border: 1px solid rgba(0, 217, 255, 0.3) !important;
      border-radius: 14px !important;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3) !important;
      z-index: 2147483647 !important;
      pointer-events: auto !important;
      white-space: nowrap !important;
      user-select: none !important;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif !important;
    `;

    // Open panel button
    const openBtn = container.querySelector('#fuse-static-open-btn');
    if (openBtn) {
      openBtn.addEventListener('mouseenter', () => {
        (openBtn as HTMLElement).style.background = 'rgba(0, 217, 255, 0.1)';
      });
      openBtn.addEventListener('mouseleave', () => {
        (openBtn as HTMLElement).style.background = 'transparent';
      });
      openBtn.addEventListener('click', async () => {
        try {
          await chrome.runtime.sendMessage({ type: 'TOGGLE_PANEL' });
        } catch (e) {
          console.error('[FuseConnect] Error toggling panel:', e);
        }
      });
    }

    // Dismiss button
    const dismissBtn = container.querySelector('#fuse-static-dismiss-btn');
    if (dismissBtn) {
      dismissBtn.addEventListener('mouseenter', () => {
        (dismissBtn as HTMLElement).style.background = 'rgba(255, 255, 255, 0.1)';
      });
      dismissBtn.addEventListener('mouseleave', () => {
        (dismissBtn as HTMLElement).style.background = 'transparent';
      });
      dismissBtn.addEventListener('click', () => {
        this.hideStaticIndicator();
      });
    }

    document.body.appendChild(container);
    this.state.staticIndicator = container;
  }

  /**
   * Animate indicators in
   */
  private animateIn(): void {
    requestAnimationFrame(() => {
      if (this.state.glowContainer) {
        this.state.glowContainer.style.opacity = '1';
      }
      if (this.state.stopContainer) {
        const button = this.state.stopContainer.querySelector(
          '#fuse-agent-stop-button'
        ) as HTMLElement;
        if (button) {
          button.style.transform = 'translateY(0)';
          button.style.opacity = '1';
        }
      }
    });
  }

  /**
   * Animate indicators out
   */
  private animateOut(): void {
    if (this.state.glowContainer) {
      this.state.glowContainer.style.opacity = '0';
    }
    if (this.state.stopContainer) {
      const button = this.state.stopContainer.querySelector(
        '#fuse-agent-stop-button'
      ) as HTMLElement;
      if (button) {
        button.style.transform = 'translateY(100px)';
        button.style.opacity = '0';
      }
    }
  }

  /**
   * Remove glow border
   */
  private removeGlowBorder(): void {
    if (this.state.glowContainer?.parentNode) {
      this.state.glowContainer.parentNode.removeChild(this.state.glowContainer);
      this.state.glowContainer = null;
    }
  }

  /**
   * Remove stop button
   */
  private removeStopButton(): void {
    if (this.state.stopContainer?.parentNode) {
      this.state.stopContainer.parentNode.removeChild(this.state.stopContainer);
      this.state.stopContainer = null;
    }
  }

  /**
   * Remove static indicator
   */
  private removeStaticIndicator(): void {
    if (this.state.staticIndicator?.parentNode) {
      this.state.staticIndicator.parentNode.removeChild(this.state.staticIndicator);
      this.state.staticIndicator = null;
    }
  }

  /**
   * Start heartbeat for static indicator
   */
  private startHeartbeat(): void {
    this.stopHeartbeat();
    this.state.heartbeatInterval = setInterval(async () => {
      try {
        const response = await chrome.runtime.sendMessage({ type: 'AGENT_INDICATOR_HEARTBEAT' });
        if (!response?.success) {
          this.hideStaticIndicator();
        }
      } catch {
        this.hideStaticIndicator();
      }
    }, 5000);
  }

  /**
   * Stop heartbeat
   */
  private stopHeartbeat(): void {
    if (this.state.heartbeatInterval) {
      clearInterval(this.state.heartbeatInterval);
      this.state.heartbeatInterval = null;
    }
  }

  /**
   * Setup message listener
   */
  private setupMessageListener(): void {
    chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
      switch (message.type) {
        case 'SHOW_AGENT_INDICATORS':
          this.showAgentActive();
          sendResponse({ success: true });
          break;
        case 'HIDE_AGENT_INDICATORS':
          this.hideAgentActive();
          sendResponse({ success: true });
          break;
        case 'SHOW_STATIC_INDICATOR':
          this.showStaticIndicator();
          sendResponse({ success: true });
          break;
        case 'HIDE_STATIC_INDICATOR':
          this.hideStaticIndicator();
          sendResponse({ success: true });
          break;
        case 'HIDE_FOR_TOOL_USE':
          this.hideForToolUse();
          sendResponse({ success: true });
          break;
        case 'SHOW_AFTER_TOOL_USE':
          this.showAfterToolUse();
          sendResponse({ success: true });
          break;
      }
      return true;
    });
  }

  /**
   * Cleanup everything
   */
  private cleanup(): void {
    this.hideAgentActive();
    this.hideStaticIndicator();
  }
}

// Export singleton
export const agentIndicator = new AgentVisualIndicator();
