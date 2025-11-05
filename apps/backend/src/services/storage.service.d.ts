export interface UploadOptions {
    bucket?: string;
    key?: string;
    contentType?: string;
    acl?: string;
}
export declare class StorageService {
    private readonly logger;
    private s3;
    constructor();
    uploadFile(file: Buffer, filename: string, options?: UploadOptions): Promise<{
        url: string;
        key: string;
    }>;
    deleteFile(key: string, bucket?: string): Promise<void>;
    getSignedUrl(key: string, expiresIn?: number, bucket?: string): Promise<string>;
}
//# sourceMappingURL=storage.service.d.ts.map