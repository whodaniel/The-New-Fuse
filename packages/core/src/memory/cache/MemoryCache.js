var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var MemoryCache_1;
import { Injectable, Logger } from '@nestjs/common';
let MemoryCache = MemoryCache_1 = class MemoryCache {
    constructor(maxSize = 1000, defaultTTL = 3600000) {
        this.logger = new Logger(MemoryCache_1.name);
        this.cache = new Map();
        this.stats = {
            hits: 0,
            misses: 0,
            evictions: 0,
        };
        this.maxSize = maxSize;
        this.defaultTTL = defaultTTL;
    }
    set(key, value, ttl) {
        const expires = Date.now() + (ttl || this.defaultTTL);
        // Evict if cache is full
        if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
            this.evictLRU();
        }
        const entry = {
            value,
            expires,
            hits: 0,
            created: Date.now(),
        };
        this.cache.set(key, entry);
        this.logger.debug(`Cache SET: ${key}`);
    }
    get(key) {
        const entry = this.cache.get(key);
        if (!entry) {
            this.stats.misses++;
            return null;
        }
        if (Date.now() > entry.expires) {
            this.cache.delete(key);
            this.stats.misses++;
            return null;
        }
        entry.hits++;
        this.stats.hits++;
        this.logger.debug(`Cache HIT: ${key}`);
        return entry.value;
    }
    delete(key) {
        const deleted = this.cache.delete(key);
        if (deleted) {
            this.logger.debug(`Cache DELETE: ${key}`);
        }
        return deleted;
    }
    clear() {
        this.cache.clear();
        this.stats = { hits: 0, misses: 0, evictions: 0 };
        this.logger.debug('Cache cleared');
    }
    has(key) {
        const entry = this.cache.get(key);
        if (!entry)
            return false;
        if (Date.now() > entry.expires) {
            this.cache.delete(key);
            return false;
        }
        return true;
    }
    keys() {
        this.cleanup();
        return Array.from(this.cache.keys());
    }
    size() {
        this.cleanup();
        return this.cache.size;
    }
    getStats() {
        this.cleanup();
        const total = this.stats.hits + this.stats.misses;
        return {
            size: this.cache.size,
            maxSize: this.maxSize,
            hits: this.stats.hits,
            misses: this.stats.misses,
            evictions: this.stats.evictions,
            hitRatio: total > 0 ? this.stats.hits / total : 0,
        };
    }
    evictLRU() {
        let oldestKey = null;
        let oldestTime = Infinity;
        for (const [key, entry] of Array.from(this.cache.entries())) {
            const accessTime = entry.created + (entry.hits * 1000); // Rough LRU calculation
            if (accessTime < oldestTime) {
                oldestTime = accessTime;
                oldestKey = key;
            }
        }
        if (oldestKey) {
            this.cache.delete(oldestKey);
            this.stats.evictions++;
            this.logger.debug(`Cache EVICT: ${oldestKey}`);
        }
    }
    cleanup() {
        const now = Date.now();
        for (const [key, entry] of Array.from(this.cache.entries())) {
            if (now > entry.expires) {
                this.cache.delete(key);
            }
        }
    }
};
MemoryCache = MemoryCache_1 = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [Object, Object])
], MemoryCache);
export { MemoryCache };
