import { DashboardState } from '../collaboration/types';

export interface Conflict {
  id: string;
  path: string[];
  source: {
    value: unknown;
    version: string;
    branch: string;
  };
  target: {
    value: unknown;
    version: string;
    branch: string;
  };
  resolved?: boolean;
  resolution?: 'source' | 'target' | 'custom';
  customValue?: unknown;
}

export class ConflictResolver {
  private conflicts: Map<string, Conflict>;

  constructor() {
    this.conflicts = new Map();
  }

  public detectConflicts(
    source: DashboardState,
    target: DashboardState,
    sourceVersion: string,
    targetVersion: string,
    sourceBranch: string,
    targetBranch: string
  ): Conflict[] {
    const conflicts: Conflict[] = [];

    // Simple conflict detection for widgets
    const allWidgetIds = new Set([
      ...Object.keys(source.widgets || {}),
      ...Object.keys(target.widgets || {}),
    ]);

    allWidgetIds.forEach((widgetId) => {
      const sourceWidget = source.widgets[widgetId];
      const targetWidget = target.widgets[widgetId];

      if (
        sourceWidget &&
        targetWidget &&
        JSON.stringify(sourceWidget) !== JSON.stringify(targetWidget)
      ) {
        conflicts.push({
          id: Math.random().toString(36).substr(2, 9),
          path: ['widgets', widgetId],
          source: {
            value: sourceWidget,
            version: sourceVersion,
            branch: sourceBranch,
          },
          target: {
            value: targetWidget,
            version: targetVersion,
            branch: targetBranch,
          },
        });
      }
    });

    conflicts.forEach((c) => this.conflicts.set(c.id, c));
    return conflicts;
  }

  public resolveConflict(
    conflictId: string,
    resolution: 'source' | 'target' | 'custom',
    customValue?: unknown
  ): void {
    const conflict = this.conflicts.get(conflictId);
    if (!conflict) {
      throw new Error(`Conflict ${conflictId} not found`);
    }

    conflict.resolved = true;
    conflict.resolution = resolution;
    conflict.customValue = customValue;
  }

  public getUnresolvedConflicts(): Conflict[] {
    return Array.from(this.conflicts.values()).filter((c) => !c.resolved);
  }

  public clear(): void {
    this.conflicts.clear();
  }
}
