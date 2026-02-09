import { Injectable, Logger } from '@nestjs/common';
import * as AWS from 'aws-sdk';
import { v4 as uuidv4 } from 'uuid';

export interface UploadOptions {
  bucket?: string;
  key?: string;
  contentType?: string;
  acl?: string;
}

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private s3: AWS.S3;

  constructor() {
    this.s3 = new AWS.S3({
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      region: process.env.AWS_REGION || 'us-east-1',
    });
  }

  async uploadFile(
    file: Buffer,
    filename: string,
    options: UploadOptions = {}
  ): Promise<{ url: string; key: string }> {
    try {
      const bucket = options.bucket || process.env.S3_BUCKET_NAME || 'the-new-fuse-uploads';
      const key = options.key || `${uuidv4()}-${filename}`;
      
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
    } catch (error) {
      this.logger.error('Failed to upload file:', error);
      throw error;
    }
  }

  async deleteFile(key: string, bucket?: string): Promise<void> {
    try {
      const deleteParams = {
        Bucket: bucket || process.env.S3_BUCKET_NAME || 'the-new-fuse-uploads',
        Key: key,
      };

      await this.s3.deleteObject(deleteParams).promise();
      
      this.logger.log(`File deleted successfully: ${key}`);
    } catch (error) {
      this.logger.error('Failed to delete file:', error);
      throw error;
    }
  }

  async getSignedUrl(
    key: string,
    expiresIn: number = 3600,
    bucket?: string
  ): Promise<string> {
    try {
      const params = {
        Bucket: bucket || process.env.S3_BUCKET_NAME || 'the-new-fuse-uploads',
        Key: key,
        Expires: expiresIn,
      };

      return this.s3.getSignedUrl('getObject', params);
    } catch (error) {
      this.logger.error('Failed to get signed URL:', error);
      throw error;
    }
  }
}