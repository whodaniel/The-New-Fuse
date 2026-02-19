/**
 * OAGI/Lux Computer Use Integration for TNF Tauri Desktop
 *
 * Based on https://github.com/agiopen-org/lux-desktop and
 * https://github.com/agiopen-org/oagi-python
 *
 * This module adds computer-use capabilities to the TNF Tauri app:
 * - Screen capture and analysis
 * - Mouse/keyboard automation
 * - Session management (Tasker, Actor, Thinker modes)
 * - Socket.IO server for real-time control
 */

import { invoke } from '@tauri-apps/api/core';

// ============================================================================
// TYPES
// ============================================================================

export type OAGIMode = 'tasker' | 'actor' | 'thinker';

export interface OAGISession {
  id: string;
  mode: OAGIMode;
  instruction: string;
  maxSteps: number;
  status: 'pending' | 'running' | 'completed' | 'failed';
  steps: OAGIStep[];
  createdAt: string;
  completedAt?: string;
  result?: string;
  error?: string;
}

export interface OAGIStep {
  id: string;
  type: 'screenshot' | 'action' | 'think' | 'complete';
  timestamp: string;
  data: any;
}

export interface OAGIAction {
  type: 'click' | 'type' | 'scroll' | 'hotkey' | 'wait' | 'drag';
  params: ActionParams;
}

export type ActionParams =
  | ClickParams
  | TypeParams
  | ScrollParams
  | HotkeyParams
  | WaitParams
  | DragParams;

export interface ClickParams {
  x: number;
  y: number;
  button?: 'left' | 'right' | 'middle';
}

export interface TypeParams {
  text: string;
  delay?: number;
}

export interface ScrollParams {
  x?: number;
  y?: number;
  amount: number;
}

export interface HotkeyParams {
  keys: string[];
  interval?: number;
}

export interface WaitParams {
  duration: number;
}

export interface DragParams {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  duration?: number;
}

export interface ScreenshotConfig {
  format?: 'png' | 'jpeg';
  quality?: number;
  width?: number;
  height?: number;
  region?: { x: number; y: number; width: number; height: number };
}

// ============================================================================
// OAGI SERVICE
// ============================================================================

class OAGIService {
  private sessions: Map<string, OAGISession> = new Map();
  private currentSession: OAGISession | null = null;

  /**
   * Create a new OAGI session
   */
  async createSession(
    instruction: string,
    mode: OAGIMode = 'actor',
    maxSteps: number = 10
  ): Promise<OAGISession> {
    const session: OAGISession = {
      id: `oagi_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      mode,
      instruction,
      maxSteps,
      status: 'pending',
      steps: [],
      createdAt: new Date().toISOString(),
    };

    this.sessions.set(session.id, session);
    this.currentSession = session;

    console.log(`🤖 Created OAGI session: ${session.id}`);
    console.log(`   Mode: ${mode}`);
    console.log(`   Instruction: ${instruction.substring(0, 50)}...`);

    return session;
  }

  /**
   * Take a screenshot
   */
  async captureScreen(config?: ScreenshotConfig): Promise<string> {
    try {
      // Use Tauri's screenshot capability
      const screenshot = await invoke<string>('capture_screen', {
        format: config?.format || 'png',
        quality: config?.quality || 85,
        region: config?.region,
      });

      if (this.currentSession) {
        this.currentSession.steps.push({
          id: `step_${Date.now()}`,
          type: 'screenshot',
          timestamp: new Date().toISOString(),
          data: { format: config?.format || 'png' },
        });
      }

      return screenshot;
    } catch (error) {
      console.error('Screenshot failed:', error);
      throw error;
    }
  }

  /**
   * Execute a click action
   */
  async click(x: number, y: number, button: 'left' | 'right' | 'middle' = 'left'): Promise<void> {
    await invoke('execute_click', { x, y, button });

    if (this.currentSession) {
      this.currentSession.steps.push({
        id: `step_${Date.now()}`,
        type: 'action',
        timestamp: new Date().toISOString(),
        data: { action: 'click', x, y, button },
      });
    }
  }

  /**
   * Execute a type action
   */
  async type(text: string, delay?: number): Promise<void> {
    await invoke('execute_type', { text, delay: delay || 0 });

    if (this.currentSession) {
      this.currentSession.steps.push({
        id: `step_${Date.now()}`,
        type: 'action',
        timestamp: new Date().toISOString(),
        data: { action: 'type', text: text.substring(0, 20), hasMore: text.length > 20 },
      });
    }
  }

  /**
   * Execute a scroll action
   */
  async scroll(amount: number, x?: number, y?: number): Promise<void> {
    await invoke('execute_scroll', { amount, x: x || 0, y: y || 0 });

    if (this.currentSession) {
      this.currentSession.steps.push({
        id: `step_${Date.now()}`,
        type: 'action',
        timestamp: new Date().toISOString(),
        data: { action: 'scroll', amount },
      });
    }
  }

  /**
   * Execute a hotkey combination
   */
  async hotkey(keys: string[], interval?: number): Promise<void> {
    await invoke('execute_hotkey', { keys, interval: interval || 0.1 });

    if (this.currentSession) {
      this.currentSession.steps.push({
        id: `step_${Date.now()}`,
        type: 'action',
        timestamp: new Date().toISOString(),
        data: { action: 'hotkey', keys },
      });
    }
  }

  /**
   * Execute a drag action
   */
  async drag(
    startX: number,
    startY: number,
    endX: number,
    endY: number,
    duration?: number
  ): Promise<void> {
    await invoke('execute_drag', { startX, startY, endX, endY, duration: duration || 0.5 });

    if (this.currentSession) {
      this.currentSession.steps.push({
        id: `step_${Date.now()}`,
        type: 'action',
        timestamp: new Date().toISOString(),
        data: { action: 'drag', startX, startY, endX, endY },
      });
    }
  }

  /**
   * Wait for specified duration
   */
  async wait(duration: number): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, duration * 1000));

    if (this.currentSession) {
      this.currentSession.steps.push({
        id: `step_${Date.now()}`,
        type: 'action',
        timestamp: new Date().toISOString(),
        data: { action: 'wait', duration },
      });
    }
  }

  /**
   * Execute an action
   */
  async executeAction(action: OAGIAction): Promise<void> {
    switch (action.type) {
      case 'click':
        const clickParams = action.params as ClickParams;
        await this.click(clickParams.x, clickParams.y, clickParams.button);
        break;
      case 'type':
        const typeParams = action.params as TypeParams;
        await this.type(typeParams.text, typeParams.delay);
        break;
      case 'scroll':
        const scrollParams = action.params as ScrollParams;
        await this.scroll(scrollParams.amount, scrollParams.x, scrollParams.y);
        break;
      case 'hotkey':
        const hotkeyParams = action.params as HotkeyParams;
        await this.hotkey(hotkeyParams.keys, hotkeyParams.interval);
        break;
      case 'drag':
        const dragParams = action.params as DragParams;
        await this.drag(
          dragParams.startX,
          dragParams.startY,
          dragParams.endX,
          dragParams.endY,
          dragParams.duration
        );
        break;
      case 'wait':
        const waitParams = action.params as WaitParams;
        await this.wait(waitParams.duration);
        break;
    }
  }

  /**
   * Complete a session
   */
  completeSession(result?: string, error?: string): void {
    if (this.currentSession) {
      this.currentSession.status = error ? 'failed' : 'completed';
      this.currentSession.completedAt = new Date().toISOString();
      this.currentSession.result = result;
      this.currentSession.error = error;

      this.currentSession.steps.push({
        id: `step_${Date.now()}`,
        type: 'complete',
        timestamp: new Date().toISOString(),
        data: { result, error },
      });

      this.currentSession = null;
    }
  }

  /**
   * Get session by ID
   */
  getSession(sessionId: string): OAGISession | undefined {
    return this.sessions.get(sessionId);
  }

  /**
   * Get current session
   */
  getCurrentSession(): OAGISession | null {
    return this.currentSession;
  }

  /**
   * List all sessions
   */
  listSessions(): OAGISession[] {
    return Array.from(this.sessions.values());
  }
}

// ============================================================================
// SINGLETON EXPORT
// ============================================================================

export const oagiService = new OAGIService();

// ============================================================================
// RUST COMMANDS (To be implemented in src-tauri/src/oagi.rs)
// ============================================================================

/**
 * Rust commands needed for OAGI functionality:
 *
 * #[tauri::command]
 * fn capture_screen(format: String, quality: u8, region: Option<Region>) -> Result<String, String>
 *
 * #[tauri::command]
 * fn execute_click(x: i32, y: i32, button: String) -> Result<(), String>
 *
 * #[tauri::command]
 * fn execute_type(text: String, delay: u32) -> Result<(), String>
 *
 * #[tauri::command]
 * fn execute_scroll(amount: i32, x: i32, y: i32) -> Result<(), String>
 *
 * #[tauri::command]
 * fn execute_hotkey(keys: Vec<String>, interval: f32) -> Result<(), String>
 *
 * #[tauri::command]
 * fn execute_drag(start_x: i32, start_y: i32, end_x: i32, end_y: i32, duration: f32) -> Result<(), String>
 */
