export interface ArtifactValidation {
    filePath: string;
    exists: boolean;
    size: number;
    lastModified: string | null;
    extension: string;
    mimeType: string | null;
}
export interface BatchValidationResult {
    validated: number;
    found: number;
    missing: number;
    results: ArtifactValidation[];
}
export declare class ArtifactValidationService {
    private readonly logger;
    validateFile(filePath: string): ArtifactValidation;
    validateDirectory(dirPath: string, pattern?: RegExp): BatchValidationResult;
    validateBatch(filePaths: string[]): BatchValidationResult;
    validateWithConstraints(filePath: string, constraints: {
        minSize?: number;
        maxSize?: number;
        allowedExtensions?: string[];
        modifiedAfter?: string;
    }): ArtifactValidation & {
        valid: boolean;
        violations: string[];
    };
    findGeneratedArtifacts(rootDir: string, artifactPatterns: string[]): BatchValidationResult;
    private inferMimeType;
}
//# sourceMappingURL=artifactValidationService.d.ts.map