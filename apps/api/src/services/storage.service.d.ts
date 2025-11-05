import { ConfigService } from '@nestjs/config';
export declare class StorageService {
    private configService;
    private readonly logger;
    private readonly uploadDir;
    constructor(configService: ConfigService);
    uploadFile(buffer: Buffer, filename: string): Promise<{
        url: string;
        path: string;
    }>;
    uploadFileFromPath(sourcePath: string, filename?: string): Promise<{
        url: string;
        path: string;
    }>;
    deleteFile(filePath: string): Promise<void>;
    generateSignedUrl(filePath: string): Promise<string>;
    listFiles(directory?: string): Promise<string[]>;
    getFileInfo(filePath: string): Promise<{
        size: number;
        mtime: Date;
        exists: boolean;
    }>;
}
//# sourceMappingURL=storage.service.d.ts.map