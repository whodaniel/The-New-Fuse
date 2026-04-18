import { StorageFile, StorageOptions } from './types';

export abstract class StorageService {
  abstract upload(
    key: string,
    data: Buffer | string | NodeJS.ReadableStream,
    options?: StorageOptions
  ): Promise<StorageFile>;

  abstract download(key: string, bucket?: string): Promise<Buffer>;

  abstract delete(key: string, bucket?: string): Promise<void>;

  abstract getMetadata(key: string, bucket?: string): Promise<StorageFile>;

  abstract exists(key: string, bucket?: string): Promise<boolean>;

  abstract getPublicUrl(key: string, bucket?: string): Promise<string>;

  abstract list(prefix?: string, bucket?: string): Promise<string[]>;
}
