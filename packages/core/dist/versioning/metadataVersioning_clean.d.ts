export interface MetadataVersion {
    version: string;
    timestamp: Date;
    metadata: Record<string, any>;
    changes?: string[];
}
export declare class MetadataVersioning {
    private readonly logger;
    private versions;
    createVersion(metadata: Record<string, any>, changes?: string[]): MetadataVersion;
    getVersion(version: string): MetadataVersion | undefined;
    getLatestVersion(): MetadataVersion | undefined;
    getAllVersions(): MetadataVersion[];
    compareVersions(version1: string, version2: string): number;
}
//# sourceMappingURL=metadataVersioning_clean.d.ts.map