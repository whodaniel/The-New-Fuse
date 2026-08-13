import { ConfigService } from '@nestjs/config';
import { StorageService } from './StorageService.js';
import { StorageFile, StorageOptions } from './types.js';
export declare class GcsStorageService extends StorageService {
    private readonly configService;
    private readonly logger;
    private readonly storage;
    private readonly defaultBucket;
    constructor(configService: ConfigService);
    upload(key: string, data: any, options?: StorageOptions): Promise<StorageFile>;
    download(key: string, bucket?: string): Promise<Buffer>;
    delete(key: string, bucket?: string): Promise<void>;
    getMetadata(key: string, bucket?: string): Promise<StorageFile>;
    exists(key: string, bucket?: string): Promise<boolean>;
    getPublicUrl(key: string, bucket?: string): Promise<string>;
    list(prefix?: string, bucket?: string): Promise<string[]>;
}
//# sourceMappingURL=GcsStorageService.d.ts.map