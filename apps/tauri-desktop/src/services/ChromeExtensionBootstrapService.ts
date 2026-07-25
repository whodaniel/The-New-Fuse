/**
 * Ensures the TNF Chrome extension is loaded in Chrome/Chromium and connected to the relay.
 * Launches a dedicated Chrome profile with --load-extension when needed (Tauri runtime only).
 */
import { invoke } from '@tauri-apps/api/core';
import { isTauriRuntime } from '../lib/isTauri';
import FederationNodeService from './FederationNodeService';

export interface ChromeExtensionBootstrapState {
  chromeAvailable: boolean;
  extensionPath: string | null;
  launched: boolean;
  connected: boolean;
  message: string;
  updatedAt: string;
}

interface ChromeLaunchResult {
  launched: boolean;
  chrome_path?: string | null;
  extension_path?: string | null;
  profile_dir: string;
  pid?: number | null;
  message: string;
}

const DEFAULT_START_URL = 'https://thenewfuse.com';

class ChromeExtensionBootstrapServiceClass {
  private inFlight: Promise<ChromeExtensionBootstrapState> | null = null;
  private lastState: ChromeExtensionBootstrapState = {
    chromeAvailable: false,
    extensionPath: null,
    launched: false,
    connected: false,
    message: 'not started',
    updatedAt: new Date(0).toISOString(),
  };

  getState(): ChromeExtensionBootstrapState {
    return this.lastState;
  }

  async ensure(
    relayUrl: string,
    startUrl = DEFAULT_START_URL
  ): Promise<ChromeExtensionBootstrapState> {
    if (!isTauriRuntime()) {
      return this.setState({
        chromeAvailable: false,
        extensionPath: null,
        launched: false,
        connected: FederationNodeService.isBrowserExtensionConnected(),
        message: 'Chrome bootstrap skipped (web preview)',
      });
    }

    if (FederationNodeService.isBrowserExtensionConnected()) {
      return this.setState({
        chromeAvailable: true,
        extensionPath: this.lastState.extensionPath,
        launched: false,
        connected: true,
        message: 'Extension already connected',
      });
    }

    if (this.inFlight) return this.inFlight;

    this.inFlight = this.run(relayUrl, startUrl).finally(() => {
      this.inFlight = null;
    });
    return this.inFlight;
  }

  private async run(relayUrl: string, startUrl: string): Promise<ChromeExtensionBootstrapState> {
    try {
      const [chromePath, extensionPath] = await Promise.all([
        invoke<string | null>('find_chrome_executable'),
        invoke<string | null>('resolve_chrome_extension_path'),
      ]);

      if (!chromePath) {
        return this.setState({
          chromeAvailable: false,
          extensionPath,
          launched: false,
          connected: false,
          message: 'Chrome/Chromium not installed — install Google Chrome for browser automation',
        });
      }

      if (!extensionPath) {
        return this.setState({
          chromeAvailable: true,
          extensionPath: null,
          launched: false,
          connected: false,
          message: 'TNF extension bundle missing — run pnpm --dir apps/chrome-extension build:v7',
        });
      }

      await this.persistBootstrapHint(relayUrl, extensionPath, chromePath);

      const launch = await invoke<ChromeLaunchResult>('launch_chrome_with_extension', {
        startUrl,
      });

      const connected = await this.waitForExtension(45000);

      return this.setState({
        chromeAvailable: true,
        extensionPath,
        launched: launch.launched,
        connected,
        message: connected
          ? launch.message
          : `${launch.message} — extension not connected yet (relay: ${relayUrl})`,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return this.setState({
        chromeAvailable: this.lastState.chromeAvailable,
        extensionPath: this.lastState.extensionPath,
        launched: false,
        connected: FederationNodeService.isBrowserExtensionConnected(),
        message: `Chrome bootstrap failed: ${message}`,
      });
    }
  }

  private async waitForExtension(timeoutMs: number): Promise<boolean> {
    if (FederationNodeService.isBrowserExtensionConnected()) return true;

    return new Promise((resolve) => {
      const deadline = Date.now() + timeoutMs;

      // `agents_updated` fires on every roster change, so re-check rather than
      // assuming the update means the extension specifically arrived.
      const onAgentsUpdated = () => {
        if (!FederationNodeService.isBrowserExtensionConnected()) return;
        cleanup();
        resolve(true);
      };

      const timer = window.setInterval(() => {
        if (FederationNodeService.isBrowserExtensionConnected()) {
          cleanup();
          resolve(true);
          return;
        }
        if (Date.now() >= deadline) {
          cleanup();
          resolve(false);
        }
      }, 500);

      FederationNodeService.on('agents_updated', onAgentsUpdated);

      const cleanup = () => {
        window.clearInterval(timer);
        FederationNodeService.off('agents_updated', onAgentsUpdated);
      };
    });
  }

  private async persistBootstrapHint(
    relayUrl: string,
    extensionPath: string,
    chromePath: string
  ): Promise<void> {
    try {
      const { homeDir } = await import('@tauri-apps/api/path');
      const home = await homeDir();
      const payload = {
        relayUrl,
        extensionPath,
        chromePath,
        profileDir: `${home}.tnf/chrome-profile`,
        autoLaunch: true,
        updatedAt: new Date().toISOString(),
      };

      await invoke('write_file', {
        path: `${home}.tnf/chrome-extension-bootstrap.json`,
        content: JSON.stringify(payload, null, 2),
      });
    } catch {
      // Non-fatal — heartbeat still publishes relay URL from synergy state.
    }
  }

  private setState(patch: Partial<ChromeExtensionBootstrapState>): ChromeExtensionBootstrapState {
    this.lastState = {
      ...this.lastState,
      ...patch,
      updatedAt: new Date().toISOString(),
    };
    return this.lastState;
  }
}

export const ChromeExtensionBootstrapService = new ChromeExtensionBootstrapServiceClass();
export default ChromeExtensionBootstrapService;
