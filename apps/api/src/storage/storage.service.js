var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var StorageService_1;
import { Injectable, Logger } from '@nestjs/common';
import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';
export var ACLType;
(function (ACLType) {
    ACLType["PRIVATE"] = "private";
    ACLType["PUBLIC_READ"] = "public-read";
    ACLType["PUBLIC_READ_WRITE"] = "public-read-write";
    ACLType["AUTHENTICATED_READ"] = "authenticated-read";
    ACLType["AWS_EXEC_READ"] = "aws-exec-read";
    ACLType["BUCKET_OWNER_READ"] = "bucket-owner-read";
    ACLType["BUCKET_OWNER_FULL_CONTROL"] = "bucket-owner-full-control";
})(ACLType || (ACLType = {}));
let StorageService = StorageService_1 = class StorageService {
    logger = new Logger(StorageService_1.name);
    s3;
    constructor() {
        this.s3 = new S3Client({
            region: process.env.AWS_REGION || 'us-east-1',
            credentials: {
                accessKeyId: process.env.AWS_ACCESS_KEY_ID,
                secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
            },
        });
    }
    async uploadFile(file, filename, options = {}) {
        try {
            const bucket = options.bucket || process.env.S3_BUCKET_NAME || 'the-new-fuse-uploads';
            const key = options.key || `${uuidv4()}-${filename}`;
            const uploadParams = {
                Bucket: bucket,
                Key: key,
                Body: file,
                ContentType: options.contentType || 'application/octet-stream',
                ACL: options.acl || ACLType.PUBLIC_READ,
            };
            const command = new PutObjectCommand(uploadParams);
            const result = await this.s3.send(command);
            const location = `https://${bucket}.s3.amazonaws.com/${key}`;
            this.logger.log(`File uploaded successfully: ${location}`);
            return {
                url: location,
                key: key,
            };
        }
        catch (error) {
            this.logger.error('Failed to upload file:', error);
            throw error;
        }
    }
    async deleteFile(key, bucket) {
        try {
            const deleteParams = {
                Bucket: bucket || process.env.S3_BUCKET_NAME || 'the-new-fuse-uploads',
                Key: key,
            };
            const command = new DeleteObjectCommand(deleteParams);
            await this.s3.send(command);
            this.logger.log(`File deleted successfully: ${key}`);
        }
        catch (error) {
            this.logger.error('Failed to delete file:', error);
            throw error;
        }
    }
    async getSignedUrl(key, expiresIn = 3600, bucket) {
        try {
            const params = {
                Bucket: bucket || process.env.S3_BUCKET_NAME || 'the-new-fuse-uploads',
                Key: key,
            };
            const command = new GetObjectCommand(params);
            return await getSignedUrl(this.s3, command, { expiresIn });
        }
        catch (error) {
            this.logger.error('Failed to get signed URL:', error);
            throw error;
        }
    }
};
StorageService = StorageService_1 = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [])
], StorageService);
export { StorageService };
//# sourceMappingURL=storage.service.js.map