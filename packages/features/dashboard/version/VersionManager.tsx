import { DashboardState } from '../collaboration/types';
import { Version, VersionControlState, VersionMetadata } from './types';

export class VersionManager {
  private state: VersionControlState;
  private storage: Storage;
  private storageKey: string;

  constructor(
    initialState: VersionControlState,
    storage: Storage = typeof localStorage !== 'undefined' ? localStorage : ({} as any),
    storageKey = 'dashboard_version_control'
  ) {
    this.state = initialState;
    this.storage = storage;
    this.storageKey = storageKey;
    this.loadState();
  }

  public createVersion(
    dashboardState: DashboardState,
    metadata: Omit<VersionMetadata, 'id' | 'number'>
  ): string {
    const id = Math.random().toString(36).substr(2, 9);
    const versionNumber = Object.keys(this.state.versions).length + 1;

    const version: Version = {
      id,
      metadata: {
        ...metadata,
        id,
        number: versionNumber,
      },
      state: dashboardState,
      changes: [],
      children: [],
    };

    this.state.versions[id] = version;
    this.state.currentVersion = id;
    this.saveState();
    return id;
  }

  public getVersionHistory(): Version[] {
    const history: Version[] = [];
    let currentId = this.state.currentVersion;

    while (currentId && this.state.versions[currentId]) {
      const v = this.state.versions[currentId];
      history.push(v);
      currentId = v.parent || '';
    }

    return history;
  }

  private loadState(): void {
    if (this.storage && typeof this.storage.getItem === 'function') {
      const saved = this.storage.getItem(this.storageKey);
      if (saved) {
        try {
          this.state = JSON.parse(saved);
        } catch (e) {
          console.error('Failed to parse version state', e);
        }
      }
    }
  }

  private saveState(): void {
    if (this.storage && typeof this.storage.setItem === 'function') {
      this.storage.setItem(this.storageKey, JSON.stringify(this.state));
    }
  }
}
