var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Injectable } from '@nestjs/common';
let AgencyHubCacheService = class AgencyHubCacheService {
    cache = new Map();
    async get(key) {
        return this.cache.get(key);
    }
    async set(key, value, ttl) {
        this.cache.set(key, value);
        // TTL logic would be implemented here
    }
    async del(key) {
        return this.cache.delete(key);
    }
    async clear() {
        this.cache.clear();
    }
    async keys(pattern) {
        return Array.from(this.cache.keys());
    }
    async exists(key) {
        return this.cache.has(key);
    }
};
AgencyHubCacheService = __decorate([
    Injectable()
], AgencyHubCacheService);
export { AgencyHubCacheService };
