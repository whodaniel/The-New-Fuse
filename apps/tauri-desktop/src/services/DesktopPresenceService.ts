/**
 * Publishes live TNF Desktop UI state for zero-turn / heartbeat / federation agents.
 */
import { buildUiPathwayCatalog, pathwayForRoute } from '../config/uiPathways';
import { isTauriRuntime } from '../lib/isTauri';
import FederationNodeService from './FederationNodeService';
import ChromeExtensionBootstrapService from './ChromeExtensionBootstrapService';
import type { OperatorSynergySnapshot } from './operatorSynergy/types';

export interface DesktopPresencePayload {
  app: 'tnf-tauri-desktop';
  version: string;
  status: 'running';
  currentRoute: string;
  currentRouteLabel: string;
  uiPathways: ReturnType<typeof buildUiPathwayCatalog>;
  unifiedAgents: Array<{ id: string; name: string; platform: string; source: string; status: string }>;
  relayUrl: string;
  apiUrl: string;
  relayConnected: boolean;
  relayRegistered: boolean;
  apiOnline: boolean;
  extensionConnected: boolean;
  chromeExtensionBootstrap: {
    chromeAvailable: boolean;
    extensionPath: string | null;
    launched: boolean;
    connected: boolean;
    message: string;
  };
  federatedAgentCount: number;
  channelCount: number;
  updatedAt: string;
  zeroTurn: {
    mandate: 'TURN_ZERO_MANDATE';
    inspectActVerify: true;
    interactionHint: string;
  };
}

const APP_VERSION = '4.1.0';

class DesktopPresenceServiceClass {
  private timer: ReturnType<typeof setInterval> | null = null;
  private lastPayload: DesktopPresencePayload | null = null;

  start(): void {
    if (this.timer) return;
    this.timer = setInterval(() => {
      if (this.lastPayload) void this.persistToDisk(this.lastPayload);
    }, 15000);
  }

  stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  async publish(currentRoute: string, synergy: OperatorSynergySnapshot): Promise<void> {
    const pathway = pathwayForRoute(currentRoute);
    const payload: DesktopPresencePayload = {
      app: 'tnf-tauri-desktop',
      version: APP_VERSION,
      status: 'running',
      currentRoute,
      currentRouteLabel: pathway?.label || currentRoute,
      uiPathways: buildUiPathwayCatalog(),
      unifiedAgents: synergy.unifiedAgents.map((a) => ({
        id: a.id,
        name: a.name,
        platform: a.platform,
        source: a.source,
        status: a.status,
      })),
      relayUrl: synergy.relayUrl,
      apiUrl: synergy.apiUrl,
      relayConnected: synergy.relayConnected,
      relayRegistered: synergy.relayRegistered,
      apiOnline: synergy.apiOnline,
      extensionConnected: synergy.extensionConnected,
      chromeExtensionBootstrap: (() => {
        const boot = ChromeExtensionBootstrapService.getState();
        return {
          chromeAvailable: boot.chromeAvailable,
          extensionPath: boot.extensionPath,
          launched: boot.launched,
          connected: boot.connected || synergy.extensionConnected,
          message: boot.message,
        };
      })(),
      federatedAgentCount: synergy.federatedAgentCount,
      channelCount: synergy.channelCount,
      updatedAt: new Date().toISOString(),
      zeroTurn: {
        mandate: 'TURN_ZERO_MANDATE',
        inspectActVerify: true,
        interactionHint:
          'Agents may navigate via hash routes (#/path), send A2A messages, and invoke page actions through federation metadata.uiPathways',
      },
    };

    this.lastPayload = payload;

    FederationNodeService.publishDesktopPresence({
      currentRoute,
      routeLabel: payload.currentRouteLabel,
      uiPathways: payload.uiPathways,
      unifiedAgentIds: payload.unifiedAgents.map((a) => a.id),
      relayConnected: payload.relayConnected,
      apiOnline: payload.apiOnline,
      version: APP_VERSION,
    });

    await this.persistToDisk(payload);
  }

  getLastPayload(): DesktopPresencePayload | null {
    return this.lastPayload;
  }

  private async persistToDisk(payload: DesktopPresencePayload): Promise<void> {
    const json = JSON.stringify(payload, null, 2);

    try {
      if (isTauriRuntime()) {
        const { homeDir } = await import('@tauri-apps/api/path');
        const { invoke } = await import('@tauri-apps/api/core');
        const home = await homeDir();
        const paths = [
          `${home}.tnf/desktop-presence/latest.json`,
          `${home}.tnf/local-subdirector/state/desktop-app-presence.json`,
        ];
        for (const filePath of paths) {
          await invoke('write_file', { path: filePath, content: json });
        }
      } else if (typeof localStorage !== 'undefined') {
        localStorage.setItem('tnf.desktop.presence', json);
      }
    } catch {
      // Preview mode or FS permission — federation metadata still updates
    }
  }
}

export const DesktopPresenceService = new DesktopPresenceServiceClass();
export default DesktopPresenceService;
