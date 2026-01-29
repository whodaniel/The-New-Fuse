import { CollaborationManager } from './CollaborationManager';
import { FilterCondition, FilterGroup, FilterState } from './types/filters';

export class FilterSyncManager {
  private collaborationManager: CollaborationManager;
  private state: FilterState;
  private listeners: Set<(state: FilterState) => void>;

  constructor(collaborationManager: CollaborationManager, initialState: FilterState) {
    this.collaborationManager = collaborationManager;
    this.state = initialState;
    this.listeners = new Set();

    (this.collaborationManager as any).subscribe('filters', (state: any) => {
      if (state) {
        this.updateStateFromRemote(state);
      }
    });
  }

  public addFilterGroup(group: Omit<FilterGroup, 'id' | 'createdAt'>): void {
    const newGroup: FilterGroup = {
      ...group,
      id: Math.random().toString(36).substr(2, 9),
      createdAt: new Date(),
      conditions: [],
    };

    this.sendUpdate('filter_group_added', { group: newGroup });
  }

  public updateFilterGroup(groupId: string, updates: Partial<FilterGroup>): void {
    this.sendUpdate('filter_group_updated', {
      groupId,
      updates: { ...updates, updatedAt: new Date() },
    });
  }

  public deleteFilterGroup(groupId: string): void {
    this.sendUpdate('filter_group_deleted', { groupId });
  }

  public addFilterCondition(groupId: string, condition: Omit<FilterCondition, 'id'>): void {
    const newCondition: FilterCondition = {
      ...condition,
      id: Math.random().toString(36).substr(2, 9),
    };

    this.sendUpdate('filter_condition_added', {
      groupId,
      condition: newCondition,
    });
  }

  private sendUpdate(type: string, data: any): void {
    (this.collaborationManager as any).sendMessage({
      type: 'filter_update',
      filterType: type,
      data,
    });
  }

  private updateStateFromRemote(newState: FilterState): void {
    this.state = newState;
    this.notifyListeners();
  }

  public subscribe(callback: (state: FilterState) => void): () => void {
    this.listeners.add(callback);
    callback(this.state);
    return () => {
      this.listeners.delete(callback);
    };
  }

  private notifyListeners(): void {
    this.listeners.forEach((callback) => callback(this.state));
  }
}
