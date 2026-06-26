import { safeStorage } from '../lib/safeStorage';

export const VOICE_PROJECT_ROOT_KEY = 'tnf.voice.projectRoot';
export const VOICE_PORT_KEY = 'tnf.voice.port';
export const VOICE_PROFILE_KEY = 'tnf.voice.profile';

export const DEFAULT_VOICE_PORT = 50005;
export const DEFAULT_VOICE_PROFILE = 'main';

const U2A_LINE =
  /^\[U2A\b[^\]]*from:([^\s\]]+)[^\]]*speaker:([^\s\]]+)[^\]]*profile:([^\s\]]+)[^\]]*id:([^\s\]]+)\]\s*(.*)$/i;

export interface ParsedU2AUtterance {
  from: string;
  speakerId: string;
  profile: string;
  messageId: string;
  body: string;
  raw: string;
}

export interface VoiceBeamTarget {
  kind?: string;
  tty?: string;
  press_enter?: boolean;
  updated_at?: number;
}

export function getVoiceProjectRoot(): string {
  return (
    safeStorage.getItem(VOICE_PROJECT_ROOT_KEY)?.trim() ||
    '/Users/danielgoldberg/Desktop/A1-Inter-LLM-Com/The-New-Fuse'
  );
}

export function setVoiceProjectRoot(root: string): void {
  safeStorage.setItem(VOICE_PROJECT_ROOT_KEY, root.trim());
}

export function getVoicePort(): number {
  const raw = safeStorage.getItem(VOICE_PORT_KEY);
  const parsed = raw ? Number.parseInt(raw, 10) : DEFAULT_VOICE_PORT;
  return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_VOICE_PORT;
}

export function setVoicePort(port: number): void {
  safeStorage.setItem(VOICE_PORT_KEY, String(port));
}

export function getVoiceProfile(): string {
  return safeStorage.getItem(VOICE_PROFILE_KEY)?.trim() || DEFAULT_VOICE_PROFILE;
}

export function setVoiceProfile(profile: string): void {
  safeStorage.setItem(VOICE_PROFILE_KEY, profile.trim() || DEFAULT_VOICE_PROFILE);
}

export function voiceStateDir(projectRoot = getVoiceProjectRoot()): string {
  return `${projectRoot.replace(/\/$/, '')}/.voicebridge`;
}

export function voiceStreamPath(projectRoot = getVoiceProjectRoot()): string {
  return `${voiceStateDir(projectRoot)}/voice_stream.txt`;
}

export function voiceTargetPath(projectRoot = getVoiceProjectRoot()): string {
  return `${voiceStateDir(projectRoot)}/voice_target.json`;
}

export function voiceResponseAudioPath(projectRoot = getVoiceProjectRoot()): string {
  return `${voiceStateDir(projectRoot)}/voice_response_audio_enabled`;
}

export function voiceServerBaseUrl(port = getVoicePort()): string {
  return `http://127.0.0.1:${port}`;
}

export function parseU2ALine(line: string): ParsedU2AUtterance | null {
  const stripped = line.trim();
  if (!stripped) return null;

  const match = stripped.match(U2A_LINE);
  if (!match) {
    return {
      from: 'operator',
      speakerId: '',
      profile: getVoiceProfile(),
      messageId: '',
      body: stripped,
      raw: stripped,
    };
  }

  return {
    from: match[1].trim(),
    speakerId: match[2].trim(),
    profile: match[3].trim(),
    messageId: match[4].trim(),
    body: match[5].trim(),
    raw: stripped,
  };
}

export function parseStreamTail(raw: string, limit = 24): ParsedU2AUtterance[] {
  const lines = raw.split('\n').map((line) => line.trim()).filter(Boolean);
  return lines.slice(-limit).map((line) => parseU2ALine(line)).filter(Boolean) as ParsedU2AUtterance[];
}
