export declare enum ACLType {
    PRIVATE = "private",
    PUBLIC_READ = "public-read",
    PUBLIC_READ_WRITE = "public-read-write",
    AUTHENTICATED_READ = "authenticated-read",
    AWS_EXEC_READ = "aws-exec-read",
    BUCKET_OWNER_READ = "bucket-owner-read",
    BUCKET_OWNER_FULL_CONTROL = "bucket-owner-full-control"
}
export interface UploadOptions {
    bucket?: string;
    key?: string;
    contentType?: string;
    acl?: ACLType;
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