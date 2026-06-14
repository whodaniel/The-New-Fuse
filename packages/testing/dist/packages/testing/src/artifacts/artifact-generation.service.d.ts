import { ConfigService } from '@nestjs/config';
export interface TestArtifact {
    name: string;
    type: 'screenshot' | 'video' | 'log' | 'report' | 'coverage' | 'other';
    content: Buffer | string;
    metadata?: Record<string, any>;
}
export interface ArtifactGenerationConfig {
    outputDir: string;
    createArchive: boolean;
    includeTimestamp: boolean;
    retentionDays: number;
}
export declare class ArtifactGenerationService {
    private readonly configService;
    private readonly config;
    constructor(configService: ConfigService);
    /**
     * Save a test artifact
     */
    saveArtifact(artifact: TestArtifact): Promise<string>;
    /**
     * Save multiple artifacts
     */
    saveArtifacts(artifacts: TestArtifact[]): Promise<string[]>;
    /**
     * Create an archive of artifacts
     */
    createArtifactArchive(name: string, artifacts: TestArtifact[] | string[], metadata?: Record<string, any>): Promise<string>;
    /**
     * Clean up old artifacts
     */
    cleanupOldArtifacts(): Promise<number>;
}
//# sourceMappingURL=artifact-generation.service.d.ts.map