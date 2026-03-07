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
  type: added' | 'removed' | 'modified';
  path: string[];
  before?: unknown;
  after?: unknown;
}

export interface Version {
  metadata: VersionMetadata;
  state: unknown;
  diff: VersionDiff[];
  parent?: string; // Parent version ID
  children: string[]; // Child version IDs
}

export interface Branch {
  id: string;
  name: string;
  description?: string;
  createdAt: Date;
  author: {
    id: string;
    name: string;
  };
  head: string; // Version ID
  base?: string; // Base branch ID
  isDefault?: boolean;
  protected?: boolean;
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
