import { EventEmitter } from 'events';

export enum CascadeMode {
  READ = 'read',
  WRITE = 'write'
}

export enum CascadeState {
  ACTIVE = 'active',
  INACTIVE = 'inactive'
}

export interface CascadeContext {
  mode: CascadeMode;
  state: CascadeState;
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

export interface CascadeOptions {
  initialMode?: CascadeMode;
  initialState?: CascadeState;
  metadata?: Record<string, unknown>;
}

export class CascadeController extends EventEmitter {
  private context: CascadeContext;

  constructor(options: CascadeOptions = {}) {
    super();
    this.context = {
      mode: options.initialMode ?? CascadeMode.READ,
      state: options.initialState ?? CascadeState.INACTIVE,
      timestamp: new Date(), // Corrected syntax
      metadata: options.metadata // Corrected syntax
    };
  }

  public getMode(): CascadeMode {
    return this.context.mode;
  }

  public getState(): CascadeState {
    return this.context.state;
  }

  public isWriteMode(): boolean {
    return this.context.mode === CascadeMode.WRITE;
  }

  public isActive(): boolean {
    return this.context.state === CascadeState.ACTIVE;
  }

  // Reconstructed setMode method
  public setMode(mode: CascadeMode): void {
    const previousMode = this.context.mode;
    if (previousMode !== mode) {
      this.context.mode = mode;
      this.context.timestamp = new Date();
      this.emit('modeChange', { previous: previousMode, current: mode });
    }
  }

  // Reconstructed setState method
  public setState(state: CascadeState): void {
    const previousState = this.context.state;
    if (previousState !== state) {
      this.context.state = state;
      this.context.timestamp = new Date();
      this.emit('stateChange', { previous: previousState, current: state });
    }
  }

  // Reconstructed toggleMode method
  public toggleMode(): void {
    const newMode = this.context.mode === CascadeMode.READ ? CascadeMode.WRITE : CascadeMode.READ;
    this.setMode(newMode);
  }

  // Added getContext method (implied by line 76)
  public getContext(): Readonly<CascadeContext> {
    return Object.freeze({ ...this.context });
  }

  // Added updateMetadata method (implied by lines 77-81)
  public updateMetadata(metadata: Record<string, unknown>): void {
    this.context.metadata = {
      ...this.context.metadata,
      ...metadata
    };
    this.emit('metadataUpdate', this.context.metadata);
  }
}

// Corrected type guard functions outside the class
export function isCascadeMode(value: string): value is CascadeMode {
  return Object.values(CascadeMode).includes(value as CascadeMode);
}

export function isCascadeState(value: string): value is CascadeState {
  return Object.values(CascadeState).includes(value as CascadeState);
}
