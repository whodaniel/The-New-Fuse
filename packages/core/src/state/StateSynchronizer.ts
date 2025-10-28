import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';

export interface StateSnapshot {
  id: string;
  data: Record<string, any>;
  timestamp: Date;
  version: number;
}

@Injectable()
export class StateSynchronizer {
  private readonly logger = new Logger(StateSynchronizer.name);
  private state: Record<string, any> = {};
  private version = 0;

  constructor(private eventEmitter: EventEmitter2) {}

  async updateState(key: string, value: any): Promise<void> {
    try {
      this.state[key] = value;
      this.version++;
      this.eventEmitter.emit('state.updated', { key, value, version: this.version });
      this.logger.debug(`State updated: ${key}`);
    } catch (error) {
      this.logger.error('Failed to update state', error);
      throw error;
    }
  }

  getState(key?: string): any {
    if (key) {
      return this.state[key];
    }
    return { ...this.state };
  }

  async createSnapshot(): Promise<StateSnapshot> {
    return {
      id: `snapshot-${Date.now()}`,
      data: { ...this.state },
      timestamp: new Date(),
      version: this.version
    };
  }

  async restoreSnapshot(snapshot: StateSnapshot): Promise<void> {
    try {
      this.state = { ...snapshot.data };
      this.version = snapshot.version;
      this.eventEmitter.emit('state.restored', snapshot);
      this.logger.log(`State restored from snapshot: ${snapshot.id}`);
    } catch (error) {
      this.logger.error('Failed to restore snapshot', error);
      throw error;
    }
  }

  async synchronize(remoteState: Record<string, any>): Promise<void> {
    try {
      Object.assign(this.state, remoteState);
      this.version++;
      this.eventEmitter.emit('state.synchronized', { version: this.version });
      this.logger.log('State synchronized');
    } catch (error) {
      this.logger.error('Failed to synchronize state', error);
      throw error;
    }
  }
}
