/**
 * Enhanced Message Formatting Utilities
 * Adapted from TNF Relay integration for Chrome Extension use
 */

export interface TNFMessageContext {
  timestamp: string;
  source: string;
  target: string;
  platform?: string;
  url?: string;
  userAgent?: string;
  sessionId?: string;
}

export interface ClaudeDesktopMessage {
  type: string;
  source: string;
  target: string;
  content: {
    action: string;
    message?: string;
    context?: any;
    metadata?: any;
  };
  timestamp: string;
  messageId?: string;
}

export class TNFMessageFormatter {
  /**
   * Format a chat message for Claude Desktop integration
   */
  static formatForClaudeDesktop(message: string, context: TNFMessageContext): ClaudeDesktopMessage {
    const messageId = this.generateMessageId();

    return {
      type: 'CLAUDE_DESKTOP_MESSAGE',
      source: context.source || 'tnf_chrome_extension',
      target: context.target || 'claude_desktop',
      content: {
        action: 'send_message',
        message: message,
        context: {
          platform: context.platform,
          url: context.url,
          timestamp: context.timestamp,
          userAgent: context.userAgent,
        },
        metadata: {
          messageId,
          sessionId: context.sessionId,
          formattedAt: new Date().toISOString(),
        },
      },
      timestamp: context.timestamp,
      messageId,
    };
  }

  /**
   * Format element detection results
   */
  static formatElementDetection(elements: any, platform: string): ClaudeDesktopMessage {
    return {
      type: 'ELEMENT_DETECTION_UPDATE',
      source: 'tnf_chrome_extension',
      target: 'claude_desktop',
      content: {
        action: 'element_status_update',
        context: {
          platform,
          elements,
          detectedAt: new Date().toISOString(),
        },
      },
      timestamp: new Date().toISOString(),
      messageId: this.generateMessageId(),
    };
  }

  /**
   * Format connection status updates
   */
  static formatConnectionStatus(status: any): ClaudeDesktopMessage {
    return {
      type: 'CONNECTION_STATUS_UPDATE',
      source: 'tnf_chrome_extension',
      target: 'claude_desktop',
      content: {
        action: 'connection_status_change',
        context: {
          connected: status.connected,
          health: status.connectionHealth,
          port: status.port,
          timestamp: new Date().toISOString(),
        },
      },
      timestamp: new Date().toISOString(),
      messageId: this.generateMessageId(),
    };
  }

  /**
   * Enhanced platform detection
   */
  static detectPlatform(): { platform: string; confidence: number; details: any } {
    const url = window.location?.href || '';
    const hostname = window.location?.hostname || '';

    // Enhanced platform detection logic from TNF Relay
    const platformDetectors = [
      {
        name: 'ChatGPT',
        pattern: /chat(gpt)?\.openai\.com/i,
        confidence: 0.95,
        selectors: {
          input: 'textarea[placeholder*="message"]',
          button: 'button[data-testid="send-button"]',
          output: '[data-message-author-role="assistant"]',
        },
      },
      {
        name: 'Claude',
        pattern: /claude\.ai/i,
        confidence: 0.95,
        selectors: {
          input: 'div[contenteditable="true"]',
          button: 'button[aria-label*="Send"]',
          output: '[data-is-streaming="false"]',
        },
      },
      {
        name: 'Gemini',
        pattern: /gemini\.google\.com/i,
        confidence: 0.9,
        selectors: {
          input: 'rich-textarea textarea',
          button: 'button[aria-label*="Send"]',
          output: '.model-response-text',
        },
      },
      {
        name: 'Perplexity',
        pattern: /perplexity\.ai/i,
        confidence: 0.85,
        selectors: {
          input: 'textarea[placeholder*="Ask"]',
          button: 'button[aria-label="Submit"]',
          output: '.prose',
        },
      },
      {
        name: 'Character.AI',
        pattern: /character\.ai/i,
        confidence: 0.8,
        selectors: {
          input: 'textarea[placeholder*="Type"]',
          button: 'button[type="submit"]',
          output: '.msg',
        },
      },
    ];

    for (const detector of platformDetectors) {
      if (detector.pattern.test(url) || detector.pattern.test(hostname)) {
        return {
          platform: detector.name,
          confidence: detector.confidence,
          details: {
            url,
            hostname,
            selectors: detector.selectors,
            detectedAt: new Date().toISOString(),
          },
        };
      }
    }

    return {
      platform: 'Unknown',
      confidence: 0.1,
      details: {
        url,
        hostname,
        detectedAt: new Date().toISOString(),
      },
    };
  }

  /**
   * Generate unique message ID
   */
  static generateMessageId(): string {
    return `tnf_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Enhanced logging with categorization
   */
  static createLogEntry(
    message: string,
    level: 'debug' | 'info' | 'warn' | 'error' | 'success' = 'info',
    category: string = 'general',
    metadata?: any
  ) {
    return {
      timestamp: new Date().toISOString(),
      time: new Date().toLocaleTimeString(),
      level,
      category,
      message,
      metadata: metadata || {},
      id: this.generateMessageId(),
    };
  }

  /**
   * Format comprehensive status for export
   */
  static formatStatusExport(status: any): any {
    return {
      timestamp: new Date().toISOString(),
      version: '4.0.0',
      source: 'tnf_chrome_extension',
      status: {
        connection: status.connection,
        elements: status.elements,
        platform: status.platform,
        settings: status.settings,
        performance: {
          uptime: Date.now() - (status.startTime || Date.now()),
          messageCount: status.messageCount || 0,
          lastActivity: status.lastActivity || new Date().toISOString(),
        },
      },
      logs: status.logs?.slice(0, 20) || [],
      metadata: {
        userAgent: navigator.userAgent,
        url: window.location?.href,
        extensionId: chrome.runtime?.id,
      },
    };
  }
}
