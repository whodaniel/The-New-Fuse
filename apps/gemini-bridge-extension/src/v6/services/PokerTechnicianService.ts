/**
 * Poker Technician Service
 * Optional component - activated only when enabled from main Fuse Connect extension
 *
 * Implements GTO Game Theory Optimal poker analysis with TNF Federation Green Channel integration
 */

import { simpleChatBridge } from '../content/adapters/SimpleChatBridge.js';

export class PokerTechnicianService {
  private static instance: PokerTechnicianService;
  private isActive = false;

  public static getInstance(): PokerTechnicianService {
    if (!PokerTechnicianService.instance) {
      PokerTechnicianService.instance = new PokerTechnicianService();
    }
    return PokerTechnicianService.instance;
  }

  /**
   * Activate Poker Technician mode
   */
  public activate(): void {
    if (this.isActive) return;

    const activationPrompt = `STEM: You are now the most prolific poker technician that ever lived.
    Your reasoning is grounded in GTO (Game Theory Optimal) balance but your edge comes from elite exploitative adjustments.
    Analyze all incoming hand histories and board states with absolute technical precision.
    Focus on: Range vs Range equity, polarized vs condensed distributions, and board texture advantage.
    You are connected to the TNF Federation Green Channel. Broadcast your high-level insights there.
    Acknowledge your technical activation now.`;

    chrome.runtime.sendMessage({
      type: 'BROADCAST_MESSAGE',
      channel: 'green',
      content: activationPrompt,
      metadata: { isSystemMessage: true },
    });

    chrome.runtime.sendMessage({
      type: 'INJECT_MESSAGE',
      content: activationPrompt,
    });

    this.isActive = true;
    console.log('[GeminiBridge] 🃏 Poker Technician activated');
  }

  /**
   * Deactivate Poker Technician mode
   */
  public deactivate(): void {
    this.isActive = false;
    console.log('[GeminiBridge] 🃏 Poker Technician deactivated');
  }

  /**
   * Push current game state to Green Channel
   */
  public pushGameState(): void {
    chrome.runtime.sendMessage({
      type: 'ACTIVITY_EVENT',
      eventType: 'GAME_STATE_PUSH',
      channel: 'green',
      metadata: {
        url: window.location.href,
        timestamp: Date.now(),
      },
    });
  }

  /**
   * Get service status
   */
  public getStatus(): { active: boolean } {
    return { active: this.isActive };
  }
}

// Register service with extension message bus
export function registerPokerServiceHandlers() {
  const service = PokerTechnicianService.getInstance();

  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (!chrome.runtime?.id) return false;

    switch (message.type) {
      case 'POKER_ACTIVATE':
        service.activate();
        sendResponse({ success: true });
        return true;

      case 'POKER_DEACTIVATE':
        service.deactivate();
        sendResponse({ success: true });
        return true;

      case 'POKER_PUSH_STATE':
        service.pushGameState();
        sendResponse({ success: true });
        return true;

      case 'POKER_GET_STATUS':
        sendResponse(service.getStatus());
        return true;
    }

    return false;
  });
}
