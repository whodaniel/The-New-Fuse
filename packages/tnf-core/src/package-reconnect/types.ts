export interface InternalPackageManifest {
  name: string;
  version: string;
  private: boolean;
  directory: string;
  packageJsonPath: string;
  main?: string;
  types?: string;
  exports?: unknown;
  scripts: Record<string, string>;
}

export type PackageProbeLoadMode = 'resolve' | 'entry' | 'none';

export interface PackageProbeResult {
  packageName: string;
  packageDir: string;
  hasMainField: boolean;
  hasTypesField: boolean;
  hasExportsField: boolean;
  hasBuildScript: boolean;
  hasTestScript: boolean;
  mainEntryPath?: string;
  mainEntryExists: boolean;
  resolvedFromWorkspace: boolean;
  resolvedPath?: string;
  loadAttempted: boolean;
  loadMode: PackageProbeLoadMode;
  loadSucceeded: boolean;
  loadError?: string;
}

