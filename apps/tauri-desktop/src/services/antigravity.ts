/**
 * Antigravity Agent Service
 *
 * Provides integration with the Antigravity Language Server via gRPC-Web
 * This service enables AI agent capabilities including:
 * - Browser automation and page control
 * - Cascade invocation management
 * - Screen recording
 * - Agent status monitoring
 */

import { invoke } from '@tauri-apps/api/core';
import { EventEmitter } from './EventEmitter';

// ============================================================================
// TYPES
// ============================================================================

export interface AntigravityCredentials {
  csrfToken: string;
  serverAddress: string;
}

export interface AntigravityStatus {
  connected: boolean;
  statusCode: number;
  message: string;
  version?: string;
}

export interface PageInfo {
  id: string;
  title: string;
  url: string;
  favicon?: string;
  active: boolean;
  tabId?: number;
}

export interface UserSettings {
  theme?: string;
  language?: string;
  autoStart?: boolean;
  notifications?: boolean;
  cascadeDefaults?: CascadeSettings;
}

export interface CascadeSettings {
  maxDepth?: number;
  timeout?: number;
  parallelism?: number;
}

export interface CascadeInvocation {
  id: string;
  conversationId: string;
  status: 'pending' | 'running' | 'completed' | 'cancelled' | 'failed';
  startedAt: Date;
  completedAt?: Date;
  error?: string;
}

export interface ScreenRecording {
  id: string;
  filename: string;
  conversationId: string;
  duration: number;
  size: number;
  data?: Uint8Array;
}

// ============================================================================
// EVENT TYPES
// ============================================================================

export type AntigravityEvent =
  | 'connected'
  | 'disconnected'
  | 'status_changed'
  | 'page_updated'
  | 'cascade_started'
  | 'cascade_completed'
  | 'cascade_cancelled'
  | 'recording_started'
  | 'recording_stopped'
  | 'error';

// ============================================================================
// SERVICE CLASS
// ============================================================================

class AntigravityServiceClass extends EventEmitter<AntigravityEvent> {
  private connected: boolean = false;
  private credentials: AntigravityCredentials | null = null;
  private status: AntigravityStatus | null = null;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private pages: PageInfo[] = [];

  constructor() {
    super();
  }

  /**
   * Initialize the Antigravity service with credentials
   */
  async initialize(credentials: AntigravityCredentials): Promise<boolean> {
    try {
      console.log('🔮 Initializing Antigravity service...');
      this.credentials = credentials;

      // Store credentials in Tauri backend
      await invoke('antigravity_set_credentials', {
        csrfToken: credentials.csrfToken,
        serverAddress: credentials.serverAddress,
      });

      // Attempt initial connection
      const connected = await this.connect();
      return connected;
    } catch (error) {
      console.error('Antigravity initialization failed:', error);
      return false;
    }
  }

  /**
   * Connect to the Antigravity server
   */
  async connect(): Promise<boolean> {
    try {
      console.log('🔌 Connecting to Antigravity server...');

      // Try to get status from server
      const status = await this.getStatus();

      if (status && status.connected) {
        this.connected = true;
        this.status = status;
        this.emit('connected');
        console.log('✅ Antigravity connected:', status.message);

        // Start periodic status checks
        this.startStatusPolling();

        return true;
      }

      return false;
    } catch (error) {
      console.error('Antigravity connection failed:', error);
      this.connected = false;
      this.emit('error', error);
      return false;
    }
  }

  /**
   * Disconnect from the Antigravity server
   */
  async disconnect(): Promise<void> {
    this.stopStatusPolling();
    this.connected = false;
    this.emit('disconnected');
    console.log('🔌 Antigravity disconnected');
  }

  /**
   * Get current connection status
   */
  async getStatus(): Promise<AntigravityStatus> {
    try {
      // First try via Tauri backend
      const status = await invoke<AntigravityStatus>('antigravity_get_status');
      this.status = status;
      this.connected = status.connected;
      return status;
    } catch {
      // Fallback to mock status when not connected
      return {
        connected: false,
        statusCode: 0,
        message: 'Not connected to Antigravity server',
      };
    }
  }

  /**
   * Get user settings from the Antigravity server
   */
  async getUserSettings(): Promise<UserSettings | null> {
    if (!this.connected) {
      console.warn('Cannot get settings: not connected');
      return null;
    }

    try {
      return await invoke<UserSettings>('antigravity_get_user_settings');
    } catch (error) {
      console.error('Failed to get user settings:', error);
      return null;
    }
  }

  /**
   * List all browser pages managed by Antigravity
   */
  async listPages(): Promise<PageInfo[]> {
    if (!this.connected) {
      return [];
    }

    try {
      this.pages = await invoke<PageInfo[]>('antigravity_list_pages');
      return this.pages;
    } catch (error) {
      console.error('Failed to list pages:', error);
      return [];
    }
  }

  /**
   * Focus a specific conversation in the Antigravity UI
   */
  async focusConversation(conversationId: string): Promise<boolean> {
    if (!this.connected) {
      console.warn('Cannot focus conversation: not connected');
      return false;
    }

    try {
      await invoke('antigravity_smart_focus', { conversationId });
      return true;
    } catch (error) {
      console.error('Failed to focus conversation:', error);
      return false;
    }
  }

  /**
   * Cancel a cascade invocation
   */
  async cancelCascade(invocationId: string): Promise<boolean> {
    if (!this.connected) {
      console.warn('Cannot cancel cascade: not connected');
      return false;
    }

    try {
      await invoke('antigravity_cancel_cascade', { invocationId });
      this.emit('cascade_cancelled', invocationId);
      return true;
    } catch (error) {
      console.error('Failed to cancel cascade:', error);
      return false;
    }
  }

  /**
   * Validate or cancel a cascade overlay
   */
  async validateCascadeOverlay(invocationId: string, validate: boolean): Promise<boolean> {
    if (!this.connected) {
      console.warn('Cannot validate cascade: not connected');
      return false;
    }

    try {
      await invoke('antigravity_validate_cascade_overlay', {
        invocationId,
        validate,
      });
      return true;
    } catch (error) {
      console.error('Failed to validate cascade overlay:', error);
      return false;
    }
  }

  /**
   * Start a screen recording
   */
  async startScreenRecording(conversationId: string): Promise<boolean> {
    if (!this.connected) {
      console.warn('Cannot start recording: not connected');
      return false;
    }

    try {
      await invoke('antigravity_start_recording', { conversationId });
      this.emit('recording_started', conversationId);
      return true;
    } catch (error) {
      console.error('Failed to start screen recording:', error);
      return false;
    }
  }

  /**
   * Stop screen recording and save
   */
  async stopScreenRecording(filename: string): Promise<ScreenRecording | null> {
    if (!this.connected) {
      console.warn('Cannot stop recording: not connected');
      return null;
    }

    try {
      const recording = await invoke<ScreenRecording>('antigravity_stop_recording', {
        filename,
      });
      this.emit('recording_stopped', recording);
      return recording;
    } catch (error) {
      console.error('Failed to stop screen recording:', error);
      return null;
    }
  }

  /**
   * Save a screen recording to the server
   */
  async saveScreenRecording(
    data: Uint8Array,
    filename: string,
    conversationId: string
  ): Promise<boolean> {
    if (!this.connected) {
      console.warn('Cannot save recording: not connected');
      return false;
    }

    try {
      await invoke('antigravity_save_recording', {
        data: Array.from(data),
        filename,
        conversationId,
      });
      return true;
    } catch (error) {
      console.error('Failed to save screen recording:', error);
      return false;
    }
  }

  /**
   * Check if connected to Antigravity server
   */
  isConnected(): boolean {
    return this.connected;
  }

  /**
   * Get current status object
   */
  getCurrentStatus(): AntigravityStatus | null {
    return this.status;
  }

  /**
   * Get cached pages list
   */
  getCachedPages(): PageInfo[] {
    return this.pages;
  }

  // ============================================================================
  // PRIVATE METHODS
  // ============================================================================

  private startStatusPolling(): void {
    this.stopStatusPolling();

    this.reconnectTimer = setInterval(async () => {
      try {
        const status = await this.getStatus();

        if (!status.connected && this.connected) {
          // Lost connection
          this.connected = false;
          this.emit('disconnected');
          console.warn('⚠️ Lost connection to Antigravity server');
        } else if (status.connected && !this.connected) {
          // Regained connection
          this.connected = true;
          this.emit('connected');
          console.log('✅ Reconnected to Antigravity server');
        }

        this.emit('status_changed', status);
      } catch (error) {
        console.error('Status polling error:', error);
      }
    }, 30000); // Poll every 30 seconds
  }

  private stopStatusPolling(): void {
    if (this.reconnectTimer) {
      clearInterval(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }
}

// ============================================================================
// SINGLETON EXPORT
// ============================================================================

export const AntigravityService = new AntigravityServiceClass();
export default AntigravityService;
