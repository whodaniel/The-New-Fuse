"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var StorageService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.StorageService = void 0;
const common_1 = require("@nestjs/common");
const AWS = __importStar(require("aws-sdk"));
const uuid_1 = require("uuid");
let StorageService = StorageService_1 = class StorageService {
    logger = new common_1.Logger(StorageService_1.name);
    s3;
    constructor() {
        this.s3 = new AWS.S3({
            accessKeyId: process.env.AWS_ACCESS_KEY_ID,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
            region: process.env.AWS_REGION || 'us-east-1',
        });
    }
    async uploadFile(file, filename, options = {}) {
        try {
            const bucket = options.bucket || process.env.S3_BUCKET_NAME || 'the-new-fuse-uploads';
            const key = options.key || `${(0, uuid_1.v4)()}-${filename}`;
            const uploadParams = {
                Bucket: bucket,
                Key: key,
                Body: file,
                ContentType: options.contentType || 'application/octet-stream',
                ACL: options.acl || 'public-read',
            };
            const result = await this.s3.upload(uploadParams).promise();
            this.logger.log(`File uploaded successfully: ${result.Location}`);
            return {
                url: result.Location,
                key: result.Key,
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
            await this.s3.deleteObject(deleteParams).promise();
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
                Expires: expiresIn,
            };
            return this.s3.getSignedUrl('getObject', params);
        }
        catch (error) {
            this.logger.error('Failed to get signed URL:', error);
            throw error;
        }
    }
};
exports.StorageService = StorageService;
exports.StorageService = StorageService = StorageService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], StorageService);
//# sourceMappingURL=storage.service.js.map