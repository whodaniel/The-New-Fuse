var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient } from '@supabase/supabase-js';
let SupabaseService = class SupabaseService {
    constructor(configService) {
        this.configService = configService;
        const supabaseUrl = this.configService.get('SUPABASE_URL');
        const supabaseKey = this.configService.get('SUPABASE_KEY');
        if (!supabaseUrl || !supabaseKey) {
            throw new Error('Supabase URL or key not configured');
        }
        this.supabase = createClient(supabaseUrl, supabaseKey);
    }
    getClient() {
        return this.supabase;
    }
    async query(table, columns = '*') {
        const { data, error } = await this.supabase.from(table).select(columns);
        if (error)
            throw new Error(error.message);
        return data;
    }
    async insert(table, values) {
        const { data, error } = await this.supabase.from(table).insert(values);
        if (error)
            throw new Error(error.message);
        return data;
    }
    async update(table, values, match) {
        const { data, error } = await this.supabase.from(table).update(values).match(match);
        if (error)
            throw new Error(error.message);
        return data;
    }
    async delete(table, match) {
        const { data, error } = await this.supabase.from(table).delete().match(match);
        if (error)
            throw new Error(error.message);
        return data;
    }
    subscribe(table, callback) {
        const channel = this.supabase.channel(`public:${table}`);
        channel
            .on('postgres_changes', { event: '*', schema: 'public', table }, callback)
            .subscribe();
        return channel;
    }
};
SupabaseService = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [ConfigService])
], SupabaseService);
export { SupabaseService };
//# sourceMappingURL=SupabaseService.js.map