import { ConfigService } from '@nestjs/config';
import { SupabaseClient, RealtimeChannel } from '@supabase/supabase-js';
export declare class SupabaseService {
    private readonly configService;
    private supabase;
    constructor(configService: ConfigService);
    getClient(): SupabaseClient;
    query(table: string, columns?: string): Promise<({
        error: true;
    } & "Received a generic string")[]>;
    insert(table: string, values: any): Promise<null>;
    update(table: string, values: any, match: any): Promise<null>;
    delete(table: string, match: any): Promise<null>;
    subscribe(table: string, callback: (payload: any) => void): RealtimeChannel;
}
//# sourceMappingURL=SupabaseService.d.ts.map