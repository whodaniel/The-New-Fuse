import { Injectable, Logger } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
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
  private supabase: SupabaseClient;

  constructor() {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      this.logger.warn('Supabase configuration missing. Storage service will fail.');
    }
    
    this.supabase = createClient(supabaseUrl || '', supabaseKey || '');
  }

  async uploadFile(
    file: Buffer,
    filename: string,
    options: UploadOptions = {}
  ): Promise<{ url: string; key: string }> {
    try {
      const bucket = options.bucket || process.env.S3_BUCKET_NAME || 'the-new-fuse-uploads';
      const key = options.key || `${uuidv4()}-${filename}`;
      
      const { data, error } = await this.supabase.storage
        .from(bucket)
        .upload(key, file, {
          contentType: options.contentType || 'application/octet-stream',
          upsert: true
        });

      if (error) throw error;
      
      const { data: { publicUrl } } = this.supabase.storage
        .from(bucket)
        .getPublicUrl(key);
      
      this.logger.log(`File uploaded successfully to Supabase: ${publicUrl}`);
      
      return {
        url: publicUrl,
        key: data.path,
      };
    } catch (error) {
      this.logger.error('Failed to upload file to Supabase:', error);
      throw error;
    }
  }

  async deleteFile(key: string, bucket?: string): Promise<void> {
    try {
      const targetBucket = bucket || process.env.S3_BUCKET_NAME || 'the-new-fuse-uploads';
      
      const { error } = await this.supabase.storage
        .from(targetBucket)
        .remove([key]);

      if (error) throw error;
      
      this.logger.log(`File deleted successfully from Supabase: ${key}`);
    } catch (error) {
      this.logger.error('Failed to delete file from Supabase:', error);
      throw error;
    }
  }

  async getSignedUrl(
    key: string,
    expiresIn: number = 3600,
    bucket?: string
  ): Promise<string> {
    try {
      const targetBucket = bucket || process.env.S3_BUCKET_NAME || 'the-new-fuse-uploads';
      
      const { data, error } = await this.supabase.storage
        .from(targetBucket)
        .createSignedUrl(key, expiresIn);

      if (error) throw error;
      
      return data.signedUrl;
    } catch (error) {
      this.logger.error('Failed to get signed URL from Supabase:', error);
      throw error;
    }
  }
}
