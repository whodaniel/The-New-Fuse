/**
 * Owner-scoped Personal Intelligence mirror payload.
 * Matches apps/frontend/src/components/personal-intelligence/types.ts
 */

export type PersonalIntelSourceId =
  | 'google_ai'
  | 'apple_notes'
  | 'google_drive'
  | 'dropbox'
  | 'box'
  | 'onedrive'
  | 'local_device'
  | 'private_github'
  | 'cli_import'
  | 'other';

export interface PersonalIntelItem {
  id: string;
  source: PersonalIntelSourceId;
  sourceLabel: string;
  title: string;
  subtitle?: string;
  activityAt?: string;
  metricLabel?: string;
  metricValue?: string | number;
  workspace?: string;
  project?: string;
  resumeHint?: string;
}

export interface SourceModuleStatus {
  id: PersonalIntelSourceId;
  name: string;
  kind: 'session_bridge' | 'notes' | 'storage_location' | 'local' | 'cli';
  description: string;
  status: 'mirrored' | 'available' | 'not_mirrored' | 'policy_ready' | 'not_connected';
  itemCount?: number;
  mirrorPath?: string;
  cliHint?: string;
}

export interface UnifiedPersonalIntelPayload {
  generatedAt: string;
  totalItems: number;
  sources: SourceModuleStatus[];
  items: PersonalIntelItem[];
  /** Server bookkeeping — not required from clients. */
  updatedAt?: string;
  ownerUserId?: string;
}

export const EMPTY_UNIFIED: UnifiedPersonalIntelPayload = {
  generatedAt: '',
  totalItems: 0,
  sources: [],
  items: [],
};

export const MAX_PERSONAL_INTEL_ITEMS = 10_000;
