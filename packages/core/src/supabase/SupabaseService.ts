import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient, RealtimeChannel } from '@supabase/supabase-js';

@Injectable()
export class SupabaseService {
  private supabase: SupabaseClient;

  constructor(private readonly configService: ConfigService) {
    const supabaseUrl = this.configService.get<string>('SUPABASE_URL');
    const supabaseKey = this.configService.get<string>('SUPABASE_KEY');

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase URL or key not configured');
    }

    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  getClient(): SupabaseClient {
    return this.supabase;
  }

  async query(table: string, columns: string = '*') {
    const { data, error } = await this.supabase.from(table).select(columns);
    if (error) throw new Error(error.message);
    return data;
  }

  async insert(table: string, values: any) {
    const { data, error } = await this.supabase.from(table).insert(values);
    if (error) throw new Error(error.message);
    return data;
  }

  async update(table: string, values: any, match: any) {
    const { data, error } = await this.supabase.from(table).update(values).match(match);
    if (error) throw new Error(error.message);
    return data;
  }

  async delete(table: string, match: any) {
    const { data, error } = await this.supabase.from(table).delete().match(match);
    if (error) throw new Error(error.message);
    return data;
  }

  subscribe(table: string, callback: (payload: any) => void): RealtimeChannel {
    const channel = this.supabase.channel(`public:${table}`);
    channel
      .on('postgres_changes', { event: '*', schema: 'public', table }, callback)
      .subscribe();
    return channel;
  }
}
