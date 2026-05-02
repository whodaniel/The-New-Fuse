import { EventEmitter } from 'node:events';
import { HitEvent } from '../types/events';

export interface EchoSuppressionConfig {
  suppressionDelayMs?: number;
}

const DEFAULT_SUPPRESSION_DELAY_MS = 1500;

export class EchoSuppression extends EventEmitter {
  private _speaking = false;
  private readonly suppressionDelayMs: number;
  private suppressionTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(config: EchoSuppressionConfig = {}) {
    super();
    this.suppressionDelayMs = config.suppressionDelayMs ?? DEFAULT_SUPPRESSION_DELAY_MS;
  }

  get speaking(): boolean {
    return this._speaking;
  }

  markSpeakingStart(): void {
    if (this.suppressionTimer !== null) {
      clearTimeout(this.suppressionTimer);
      this.suppressionTimer = null;
    }
    this._speaking = true;
    this.emit('speaking_start');
  }

  markSpeakingEnd(): void {
    // Remain in speaking state for the grace period after TTS ends
    this.suppressionTimer = setTimeout(() => {
      this._speaking = false;
      this.suppressionTimer = null;
      this.emit('speaking_end');
    }, this.suppressionDelayMs);
  }

  isSpeaking(): boolean {
    return this._speaking;
  }

  /**
   * If the system is currently speaking (or in the post-speech grace period),
   * return null to suppress the hit. Otherwise return the hit unchanged.
   */
  filterHit(hit: HitEvent): HitEvent | null {
    if (this._speaking) {
      return null;
    }
    return hit;
  }
}
