import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

/**
 * Supabase query options
 */
export interface SupabaseQueryOptions {
  select?: string;
  filter?: Record<string, any>;
  order?: { column: string; ascending?: boolean };
  limit?: number;
  offset?: number;
}

/**
 * Supabase insert/update data
 */
export interface SupabaseData {
  [key: string]: any;
}

/**
 * Supabase query result
 */
export interface SupabaseQueryResult<T = any> {
  data: T[];
  error: any;
  count?: number;
}

/**
 * SupabaseService provides agent tools access to Supabase database operations
 * This service is separate from VectorDatabaseService and provides general CRUD operations
 */
@Injectable()
export class SupabaseService implements OnModuleInit {
  private client: SupabaseClient | null = null;
  private initialized = false;
  private supabaseUrl: string;
  private supabaseKey: string;

  constructor(private readonly configService: ConfigService) {
    this.supabaseUrl = this.configService.get<string>('SUPABASE_URL', '');
    this.supabaseKey =
      this.configService.get<string>('SUPABASE_SERVICE_ROLE_KEY') ||
      this.configService.get<string>('SUPABASE_ANON_KEY') ||
      '';
  }

  /**
   * Initialize Supabase client on module initialization
   */
  async onModuleInit() {
    await this.initialize();
  }

  /**
   * Initialize the Supabase client
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    if (!this.supabaseUrl || !this.supabaseKey) {
      console.warn(
        'Supabase is not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY/SUPABASE_ANON_KEY to enable Supabase functionality.'
      );
      return;
    }

    try {
      this.client = createClient(this.supabaseUrl, this.supabaseKey, {
        auth: {
          autoRefreshToken: true,
          persistSession: true,
        },
      });

      this.initialized = true;
      console.log('SupabaseService initialized successfully');
    } catch (error) {
      console.error('Failed to initialize SupabaseService:', error);
      throw error;
    }
  }

  /**
   * Ensure client is initialized before operations
   */
  private async ensureInitialized(): Promise<void> {
    if (!this.initialized || !this.client) {
      await this.initialize();
    }

    if (!this.client) {
      throw new Error(
        'Supabase client is not initialized. Please configure SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.'
      );
    }
  }

  /**
   * Query data from a Supabase table
   */
  async query<T = any>(
    table: string,
    options?: SupabaseQueryOptions
  ): Promise<SupabaseQueryResult<T>> {
    await this.ensureInitialized();

    let query = this.client!.from(table).select(options?.select || '*', {
      count: 'exact',
    });

    // Apply filters
    if (options?.filter) {
      Object.entries(options.filter).forEach(([key, value]) => {
        query = query.eq(key, value);
      });
    }

    // Apply ordering
    if (options?.order) {
      query = query.order(options.order.column, {
        ascending: options.order.ascending ?? true,
      });
    }

    // Apply pagination
    if (options?.limit) {
      query = query.limit(options.limit);
    }

    if (options?.offset) {
      query = query.range(
        options.offset,
        options.offset + (options.limit || 10) - 1
      );
    }

    const { data, error, count } = await query;

    return {
      data: (data as T[]) || [],
      error,
      count: count || 0,
    };
  }

  /**
   * Insert data into a Supabase table
   */
  async insert<T = any>(
    table: string,
    data: SupabaseData | SupabaseData[]
  ): Promise<SupabaseQueryResult<T>> {
    await this.ensureInitialized();

    const { data: insertedData, error } = await this.client!
      .from(table)
      .insert(data)
      .select();

    return {
      data: (insertedData as T[]) || [],
      error,
    };
  }

  /**
   * Update data in a Supabase table
   */
  async update<T = any>(
    table: string,
    data: SupabaseData,
    filter: Record<string, any>
  ): Promise<SupabaseQueryResult<T>> {
    await this.ensureInitialized();

    let query = this.client!.from(table).update(data);

    // Apply filters
    Object.entries(filter).forEach(([key, value]) => {
      query = query.eq(key, value);
    });

    const { data: updatedData, error } = await query.select();

    return {
      data: (updatedData as T[]) || [],
      error,
    };
  }

  /**
   * Upsert data in a Supabase table (insert or update)
   */
  async upsert<T = any>(
    table: string,
    data: SupabaseData | SupabaseData[],
    onConflict?: string
  ): Promise<SupabaseQueryResult<T>> {
    await this.ensureInitialized();

    const options: any = {};
    if (onConflict) {
      options.onConflict = onConflict;
    }

    const { data: upsertedData, error } = await this.client!
      .from(table)
      .upsert(data, options)
      .select();

    return {
      data: (upsertedData as T[]) || [],
      error,
    };
  }

  /**
   * Delete data from a Supabase table
   */
  async delete<T = any>(
    table: string,
    filter: Record<string, any>
  ): Promise<SupabaseQueryResult<T>> {
    await this.ensureInitialized();

    let query = this.client!.from(table).delete();

    // Apply filters
    Object.entries(filter).forEach(([key, value]) => {
      query = query.eq(key, value);
    });

    const { data: deletedData, error } = await query.select();

    return {
      data: (deletedData as T[]) || [],
      error,
    };
  }

  /**
   * Execute a Supabase RPC (Remote Procedure Call) function
   */
  async rpc<T = any>(
    functionName: string,
    params?: Record<string, any>
  ): Promise<SupabaseQueryResult<T>> {
    await this.ensureInitialized();

    const { data, error } = await this.client!.rpc(functionName, params);

    return {
      data: Array.isArray(data) ? data : data ? [data] : [],
      error,
    };
  }

  /**
   * Subscribe to real-time changes on a table
   */
  subscribeToTable(
    table: string,
    callback: (payload: any) => void,
    filter?: Record<string, any>
  ): () => void {
    if (!this.client) {
      throw new Error('Supabase client is not initialized');
    }

    let channel = this.client
      .channel(`${table}-changes`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: table,
          filter: filter
            ? Object.entries(filter)
                .map(([key, value]) => `${key}=eq.${value}`)
                .join(',')
            : undefined,
        },
        callback
      )
      .subscribe();

    // Return unsubscribe function
    return () => {
      channel.unsubscribe();
    };
  }

  /**
   * Get the Supabase client instance
   */
  getClient(): SupabaseClient | null {
    return this.client;
  }

  /**
   * Check if the service is initialized
   */
  isInitialized(): boolean {
    return this.initialized && this.client !== null;
  }

  /**
   * Get storage bucket operations
   */
  storage(bucketName: string) {
    if (!this.client) {
      throw new Error('Supabase client is not initialized');
    }
    return this.client.storage.from(bucketName);
  }

  /**
   * Upload file to Supabase storage
   */
  async uploadFile(
    bucketName: string,
    path: string,
    file: File | Blob | Buffer,
    options?: { contentType?: string; upsert?: boolean }
  ) {
    await this.ensureInitialized();

    const { data, error } = await this.client!.storage
      .from(bucketName)
      .upload(path, file, {
        contentType: options?.contentType,
        upsert: options?.upsert ?? false,
      });

    return { data, error };
  }

  /**
   * Download file from Supabase storage
   */
  async downloadFile(bucketName: string, path: string) {
    await this.ensureInitialized();

    const { data, error } = await this.client!.storage
      .from(bucketName)
      .download(path);

    return { data, error };
  }

  /**
   * Get public URL for a file in Supabase storage
   */
  getPublicUrl(bucketName: string, path: string): string {
    if (!this.client) {
      throw new Error('Supabase client is not initialized');
    }

    const { data } = this.client.storage.from(bucketName).getPublicUrl(path);

    return data.publicUrl;
  }

  /**
   * Delete file from Supabase storage
   */
  async deleteFile(bucketName: string, paths: string | string[]) {
    await this.ensureInitialized();

    const pathsArray = Array.isArray(paths) ? paths : [paths];

    const { data, error } = await this.client!.storage
      .from(bucketName)
      .remove(pathsArray);

    return { data, error };
  }
}
