import { DashboardState } from '../collaboration/types';

export interface VersionMetadata {
  id: string;
  number: number;
  createdAt: Date;
  author: {
    id: string;
    name: string;
  };
  message: string;
  tags?: string[];
  isCheckpoint?: boolean;
}

export interface VersionDiff {
  type: 'added' | 'removed' | 'modified';
  path: string[];
  before?: unknown;
  after?: unknown;
}

export interface Version {
  id: string;
  metadata: VersionMetadata;
  state: DashboardState;
  changes: VersionDiff[];
  parent?: string;
  children: string[];
}

export interface Branch {
  id: string;
  name: string;
  head: string;
  base: string;
  createdAt: Date;
}

export interface VersionControlState {
  versions: Record<string, Version>;
  branches: Record<string, Branch>;
  currentVersion: string;
  currentBranch: string;
  stagingArea: {
    changes: VersionDiff[];
    message: string;
  };
}
