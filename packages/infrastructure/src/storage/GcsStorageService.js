var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var GcsStorageService_1;
import { Injectable, Logger } from '@nestjs/common';
import { Storage } from '@google-cloud/storage';
import { ConfigService } from '@nestjs/config';
import { StorageService } from './StorageService.js';
let GcsStorageService = GcsStorageService_1 = class GcsStorageService extends StorageService {
    constructor(configService) {
        super();
        this.configService = configService;
        this.logger = new Logger(GcsStorageService_1.name);
        const projectId = this.configService.get('GCP_PROJECT_ID');
        const keyFilename = this.configService.get('GCP_KEY_FILE');
        this.defaultBucket = this.configService.get('GCS_BUCKET', 'tnf-storage');
        const options = {};
        if (projectId)
            options.projectId = projectId;
        if (keyFilename)
            options.keyFilename = keyFilename;
        this.storage = new Storage(options);
    }
    async upload(key, data, options) {
        const bucketName = options?.bucket || this.defaultBucket;
        const bucket = this.storage.bucket(bucketName);
        const file = bucket.file(key);
        this.logger.log(`Uploading to GCS: ${bucketName}/${key}`);
        const metadata = {
            contentType: options?.contentType,
            metadata: options?.metadata,
        };
        if (options?.isPublic) {
            metadata.acl = [{ entity: 'allUsers', role: 'READER' }];
        }
        if (data instanceof Buffer || typeof data === 'string') {
            await file.save(data, {
                metadata,
                resumable: false,
            });
        }
        else {
            // Stream upload
            await new Promise((resolve, reject) => {
                data.pipe(file.createWriteStream({ metadata })).on('error', reject).on('finish', resolve);
            });
        }
        return this.getMetadata(key, bucketName);
    }
    async download(key, bucket) {
        const bucketName = bucket || this.defaultBucket;
        const [content] = await this.storage.bucket(bucketName).file(key).download();
        return content;
    }
    async delete(key, bucket) {
        const bucketName = bucket || this.defaultBucket;
        await this.storage.bucket(bucketName).file(key).delete();
    }
    async getMetadata(key, bucket) {
        const bucketName = bucket || this.defaultBucket;
        const [metadata] = await this.storage.bucket(bucketName).file(key).getMetadata();
        return {
            key,
            bucket: bucketName,
            size: parseInt(metadata.size, 10),
            contentType: metadata.contentType,
            metadata: metadata.metadata,
            updatedAt: new Date(metadata.updated),
            publicUrl: `https://storage.googleapis.com/${bucketName}/${key}`,
        };
    }
    async exists(key, bucket) {
        const bucketName = bucket || this.defaultBucket;
        const [exists] = await this.storage.bucket(bucketName).file(key).exists();
        return exists;
    }
    async getPublicUrl(key, bucket) {
        const bucketName = bucket || this.defaultBucket;
        return `https://storage.googleapis.com/${bucketName}/${key}`;
    }
    async list(prefix, bucket) {
        const bucketName = bucket || this.defaultBucket;
        const [files] = await this.storage.bucket(bucketName).getFiles({ prefix });
        return files.map((f) => f.name);
    }
};
GcsStorageService = GcsStorageService_1 = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [ConfigService])
], GcsStorageService);
export { GcsStorageService };
//# sourceMappingURL=GcsStorageService.js.map