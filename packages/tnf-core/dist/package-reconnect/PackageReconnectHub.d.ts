import type { InternalPackageManifest, PackageProbeResult } from './types.js';
export declare class PackageReconnectHub {
    private readonly repoRoot;
    private readonly rootRequire;
    constructor(repoRoot?: string);
    getRepoRoot(): string;
    listPackages(): InternalPackageManifest[];
    findPackage(packageName: string): InternalPackageManifest | undefined;
    probePackage(packageName: string, options?: {
        loadRuntime?: boolean;
    }): Promise<PackageProbeResult>;
    probeAll(options?: {
        loadRuntime?: boolean;
    }): Promise<PackageProbeResult[]>;
}
