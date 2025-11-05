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
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs/promises';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
let StorageService = StorageService_1 = class StorageService {
    configService;
    logger = new Logger(StorageService_1.name);
    uploadDir;
    constructor(configService) {
        this.configService = configService;
        this.uploadDir = this.configService.get('UPLOAD_DIR', './uploads');
    }
    async uploadFile(buffer, filename) {
        try {
            const fileId = uuidv4();
            const ext = path.extname(filename);
            const newFilename = `${fileId}${ext}`;
            const filePath = path.join(this.uploadDir, newFilename);
            await fs.mkdir(this.uploadDir, { recursive: true });
            await fs.writeFile(filePath, buffer);
            return {
                url: `/uploads/${newFilename}`,
                path: filePath
            };
        }
        catch (error) {
            throw new Error(`Failed to upload file: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    async uploadFileFromPath(sourcePath, filename) {
        try {
            const buffer = await fs.readFile(sourcePath);
            const finalFilename = filename || path.basename(sourcePath);
            return this.uploadFile(buffer, finalFilename);
        }
        catch (error) {
            throw new Error(`Failed to upload file from path: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    async deleteFile(filePath) {
        try {
            await fs.unlink(filePath);
        }
        catch (error) {
            throw new Error(`Failed to delete file: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    async generateSignedUrl(filePath) {
        try {
            // For local storage, return the direct path
            // In production, this would generate a signed URL for cloud storage
            return `/uploads/${path.basename(filePath)}`;
        }
        catch (error) {
            throw new Error(`Failed to generate signed URL: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    async listFiles(directory) {
        try {
            const targetDir = directory || this.uploadDir;
            const files = await fs.readdir(targetDir);
            return files;
        }
        catch (error) {
            throw new Error(`Failed to list files: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    async getFileInfo(filePath) {
        try {
            const stats = await fs.stat(filePath);
            return {
                size: stats.size,
                mtime: stats.mtime,
                exists: true
            };
        }
        catch (error) {
            return {
                size: 0,
                mtime: new Date(),
                exists: false
            };
        }
    }
};
StorageService = StorageService_1 = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [ConfigService])
], StorageService);
export { StorageService };
//# sourceMappingURL=storage.service.js.map