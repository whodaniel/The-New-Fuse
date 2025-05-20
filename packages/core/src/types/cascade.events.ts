import { CascadeMode, CascadeState } from './cascade.js';

export interface CascadeModeChangeEvent {
  previous: CascadeMode;
  current: CascadeMode;
  timestamp: Date;
}

export interface CascadeStateChangeEvent {
  previous: CascadeState;
  current: CascadeState;
  timestamp: Date;
}

export interface CascadeMetadataUpdateEvent {
  metadata: Record<string, unknown>;
  timestamp: Date;
}

export interface CascadeErrorEvent {
  code: string;
  message: string;
  details?: Record<string, unknown>;
  timestamp: Date;
}

export type CascadeEventMap = {
  'modeChange': CascadeModeChangeEvent;
  'stateChange': CascadeStateChangeEvent;
  'metadataUpdate': CascadeMetadataUpdateEvent;
  'error': CascadeErrorEvent;
};

export type CascadeEventType = keyof CascadeEventMap;
export type CascadeEventPayload<T extends CascadeEventType> = CascadeEventMap[T];
