import { invoke } from '@tauri-apps/api/core';
import {
  getVoicePort,
  getVoiceProfile,
  getVoiceProjectRoot,
  parseStreamTail,
  type ParsedU2AUtterance,
  type VoiceBeamTarget,
  voiceResponseAudioPath,
  voiceServerBaseUrl,
  voiceStreamPath,
  voiceTargetPath,
} from '../config/voiceBridge';
import { isTauriRuntime } from '../lib/isTauri';

export interface VoiceBridgeSnapshot {
  online: boolean;
  micPaused: boolean;
  aiSpeaking: boolean;
  responseAudioEnabled: boolean;
  profile: string;
  port: number;
  projectRoot: string;
  stateDir: string;
  speakerName: string;
  beamTarget: VoiceBeamTarget | null;
  recentUtterances: ParsedU2AUtterance[];
  kwsEnabled: boolean;
  kwsStreamId: string;
  lastError: string | null;
  updatedAt: string;
}

type Listener = (snapshot: VoiceBridgeSnapshot) => void;

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  });
  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText}`);
  }
  return (await response.json()) as T;
}

async function readLocalFile(path: string): Promise<string | null> {
  if (!isTauriRuntime()) return null;
  try {
    const exists = await invoke<boolean>('file_exists', { path });
    if (!exists) return null;
    return await invoke<string>('read_file', { path });
  } catch {
    return null;
  }
}

async function writeLocalFlag(path: string, enabled: boolean): Promise<void> {
  if (!isTauriRuntime()) {
    throw new Error('Response audio toggle requires the Tauri desktop app.');
  }
  if (enabled) {
    await invoke('write_file', { path, content: '' });
    return;
  }
  const exists = await invoke<boolean>('file_exists', { path });
  if (exists) {
    await invoke('execute_command', { command: `rm -f "${path.replace(/"/g, '\\"')}"` });
  }
}

class VoiceBridgeService {
  private snapshot: VoiceBridgeSnapshot = this.emptySnapshot();
  private listeners = new Set<Listener>();
  private pollTimer: number | null = null;
  private pollIntervalMs = 2000;
  private subscriberCount = 0;

  private emptySnapshot(): VoiceBridgeSnapshot {
    const projectRoot = getVoiceProjectRoot();
    return {
      online: false,
      micPaused: false,
      aiSpeaking: false,
      responseAudioEnabled: false,
      profile: getVoiceProfile(),
      port: getVoicePort(),
      projectRoot,
      stateDir: `${projectRoot.replace(/\/$/, '')}/.voicebridge`,
      speakerName: 'operator',
      beamTarget: null,
      recentUtterances: [],
      kwsEnabled: false,
      kwsStreamId: '',
      lastError: null,
      updatedAt: new Date().toISOString(),
    };
  }

  getSnapshot(): VoiceBridgeSnapshot {
    return { ...this.snapshot, recentUtterances: [...this.snapshot.recentUtterances] };
  }

  onChange(listener: Listener): () => void {
    this.listeners.add(listener);
    this.subscriberCount += 1;
    if (this.subscriberCount === 1) {
      this.startPolling(this.pollIntervalMs);
    }
    listener(this.getSnapshot());
    return () => {
      this.listeners.delete(listener);
      this.subscriberCount = Math.max(0, this.subscriberCount - 1);
      if (this.subscriberCount === 0) {
        this.stopPolling();
      }
    };
  }

  private emit(): void {
    const next = this.getSnapshot();
    for (const listener of this.listeners) {
      listener(next);
    }
  }

  private patch(partial: Partial<VoiceBridgeSnapshot>): void {
    this.snapshot = { ...this.snapshot, ...partial, updatedAt: new Date().toISOString() };
    this.emit();
  }

  startPolling(intervalMs = 2000): void {
    this.pollIntervalMs = intervalMs;
    this.stopPolling();
    void this.refresh();
    this.pollTimer = window.setInterval(() => {
      void this.refresh();
    }, intervalMs);
  }

  stopPolling(): void {
    if (this.pollTimer !== null) {
      window.clearInterval(this.pollTimer);
      this.pollTimer = null;
    }
  }

  async refresh(): Promise<VoiceBridgeSnapshot> {
    const projectRoot = getVoiceProjectRoot();
    const port = getVoicePort();
    const profile = getVoiceProfile();
    const baseUrl = voiceServerBaseUrl(port);

    this.patch({
      projectRoot,
      port,
      profile,
      stateDir: `${projectRoot.replace(/\/$/, '')}/.voicebridge`,
    });

    try {
      const [micState, aiState, kwsState] = await Promise.all([
        fetchJson<{ paused: boolean }>(`${baseUrl}/mic_state`),
        fetchJson<{ speaking: boolean }>(`${baseUrl}/is_ai_speaking`),
        fetchJson<{ enabled: boolean; stream_id?: string }>(`${baseUrl}/kws_state`).catch(() => ({
          enabled: false,
          stream_id: '',
        })),
      ]);

      const responseAudioPath = voiceResponseAudioPath(projectRoot);
      const [streamRaw, targetRaw, responseAudioExists] = await Promise.all([
        readLocalFile(voiceStreamPath(projectRoot)),
        readLocalFile(voiceTargetPath(projectRoot)),
        isTauriRuntime()
          ? invoke<boolean>('file_exists', { path: responseAudioPath }).catch(() => false)
          : Promise.resolve(false),
      ]);

      const recentUtterances = streamRaw ? parseStreamTail(streamRaw, 24) : [];
      const speakerName = recentUtterances.at(-1)?.from || 'operator';
      let beamTarget: VoiceBeamTarget | null = null;
      if (targetRaw) {
        try {
          beamTarget = JSON.parse(targetRaw) as VoiceBeamTarget;
        } catch {
          beamTarget = null;
        }
      }

      this.patch({
        online: true,
        micPaused: Boolean(micState.paused),
        aiSpeaking: Boolean(aiState.speaking),
        responseAudioEnabled: Boolean(responseAudioExists),
        kwsEnabled: Boolean(kwsState.enabled),
        kwsStreamId: kwsState.stream_id || '',
        speakerName,
        beamTarget,
        recentUtterances,
        lastError: null,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.patch({
        online: false,
        lastError: message,
      });
    }

    return this.getSnapshot();
  }

  async pauseBeam(): Promise<void> {
    await fetchJson(`${voiceServerBaseUrl()}/mic_pause`, { method: 'POST', body: '{}' });
    await this.refresh();
  }

  async resumeBeam(): Promise<void> {
    await fetchJson(`${voiceServerBaseUrl()}/mic_resume`, { method: 'POST', body: '{}' });
    await this.refresh();
  }

  async stopSpeech(): Promise<void> {
    await fetchJson(`${voiceServerBaseUrl()}/interrupt`, {
      method: 'POST',
      body: JSON.stringify({ reason: 'desktop voice hub' }),
    });
    await this.refresh();
  }

  async activateBridge(): Promise<void> {
    await fetchJson(`${voiceServerBaseUrl()}/activate`, { method: 'POST', body: '{}' });
    await this.refresh();
  }

  async sendUtterance(text: string): Promise<void> {
    const trimmed = text.trim();
    if (!trimmed) return;
    await fetch(`${voiceServerBaseUrl()}/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: trimmed }),
    });
    await this.refresh();
  }

  async setResponseAudioEnabled(enabled: boolean): Promise<void> {
    await writeLocalFlag(voiceResponseAudioPath(getVoiceProjectRoot()), enabled);
    await this.refresh();
  }
}

const voiceBridgeService = new VoiceBridgeService();
export default voiceBridgeService;
