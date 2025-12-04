export interface FileValidationOptions {
    maxSize?: number;
    allowedTypes?: string[];
    maxFiles?: number;
}
export interface FileValidationResult {
    valid: boolean;
    errors: string[];
}
export interface FileInfo {
    name: string;
    size: number;
    type: string;
    extension: string;
    lastModified: number;
}
export declare function getFileInfo(file: File): FileInfo;
export declare function validateFile(file: File, options?: FileValidationOptions): FileValidationResult;
export declare function validateFiles(files: File[], options?: FileValidationOptions): FileValidationResult;
export declare function readFileAsDataURL(file: File): Promise<string>;
export declare function readFileAsText(file: File): Promise<string>;
export declare function formatFileSize(bytes: number): string;
export declare function downloadFile(url: string, filename: string): void;
export declare function downloadBlob(blob: Blob, filename: string): Promise<void>;
export declare function getMimeType(filename: string): string;
