import { DashboardState } from '../exporters/types';

export class DashboardStorage {
  private storage: Storage;
  private prefix: string;

  constructor(
    storage: Storage = typeof localStorage !== 'undefined' ? localStorage : ({} as any),
    prefix = 'dashboard_'
  ) {
    this.storage = storage;
    this.prefix = prefix;
  }

  public async saveDashboard(dashboard: DashboardState): Promise<void> {
    const key = this.getKey(dashboard.id);
    const serialized = JSON.stringify(dashboard);
    this.storage.setItem(key, serialized);
  }

  public async loadDashboard(id: string): Promise<DashboardState | null> {
    const key = this.getKey(id);
    const serialized = this.storage.getItem(key);
    if (!serialized) return null;
    try {
      return JSON.parse(serialized);
    } catch (e) {
      console.error('Failed to parse dashboard data', e);
      return null;
    }
  }

  public async deleteDashboard(id: string): Promise<void> {
    const key = this.getKey(id);
    this.storage.removeItem(key);
  }

  private getKey(id: string): string {
    return `${this.prefix}${id}`;
  }
}
