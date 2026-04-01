import { Injectable, Logger } from '@nestjs/common';
// @ts-ignore
import { Storage } from '@google-cloud/storage';
import { StorageService } from './StorageService';
import { StorageFile, StorageOptions, StorageConfig } from './types';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class GcsStorageService extends StorageService {
  private readonly logger = new Logger(GcsStorageService.name);
  private readonly storage: any;
  private readonly defaultBucket: string;

  constructor(private readonly configService: ConfigService) {
    super();
    
    const projectId = this.configService.get<string>('GCP_PROJECT_ID');
    const keyFilename = this.configService.get<string>('GCP_KEY_FILE');
    this.defaultBucket = this.configService.get<string>('GCS_BUCKET', 'tnf-storage');

    const options: any = {};
    if (projectId) options.projectId = projectId;
    if (keyFilename) options.keyFilename = keyFilename;

    this.storage = new Storage(options);
  }

  async upload(
    key: string,
    data: any,
    options?: StorageOptions
  ): Promise<StorageFile> {
    const bucketName = options?.bucket || this.defaultBucket;
    const bucket = this.storage.bucket(bucketName);
    const file = bucket.file(key);

    this.logger.log(`Uploading to GCS: ${bucketName}/${key}`);

    const metadata: any = {
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
    } else {
      // Stream upload
      await new Promise((resolve, reject) => {
        data
          .pipe(file.createWriteStream({ metadata }))
          .on('error', reject)
          .on('finish', resolve);
      });
    }

    return this.getMetadata(key, bucketName);
  }

  async download(key: string, bucket?: string): Promise<Buffer> {
    const bucketName = bucket || this.defaultBucket;
    const [content] = await this.storage.bucket(bucketName).file(key).download();
    return content;
  }

  async delete(key: string, bucket?: string): Promise<void> {
    const bucketName = bucket || this.defaultBucket;
    await this.storage.bucket(bucketName).file(key).delete();
  }

  async getMetadata(key: string, bucket?: string): Promise<StorageFile> {
    const bucketName = bucket || this.defaultBucket;
    const [metadata] = await this.storage.bucket(bucketName).file(key).getMetadata();

    return {
      key,
      bucket: bucketName,
      size: parseInt(metadata.size as string, 10),
      contentType: metadata.contentType,
      metadata: metadata.metadata,
      updatedAt: new Date(metadata.updated),
      publicUrl: `https://storage.googleapis.com/${bucketName}/${key}`,
    };
  }

  async exists(key: string, bucket?: string): Promise<boolean> {
    const bucketName = bucket || this.defaultBucket;
    const [exists] = await this.storage.bucket(bucketName).file(key).exists();
    return exists;
  }

  async getPublicUrl(key: string, bucket?: string): Promise<string> {
    const bucketName = bucket || this.defaultBucket;
    return `https://storage.googleapis.com/${bucketName}/${key}`;
  }

  async list(prefix?: string, bucket?: string): Promise<string[]> {
    const bucketName = bucket || this.defaultBucket;
    const [files] = await this.storage.bucket(bucketName).getFiles({ prefix });
    return files.map((f: any) => f.name);
  }
}
