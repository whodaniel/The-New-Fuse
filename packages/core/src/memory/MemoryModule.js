var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Module } from '@nestjs/common';
import { MemoryManager } from './MemoryManager';
import { MemoryOptimizer } from './MemoryOptimizer';
import { MemoryIndexer } from './MemoryIndexer';
import { VectorMemoryStore } from './VectorMemoryStore';
import { MemoryLeakDetector } from './MemoryLeakDetector';
let MemoryModule = class MemoryModule {
};
MemoryModule = __decorate([
    Module({
        providers: [
            MemoryManager,
            MemoryOptimizer,
            MemoryIndexer,
            VectorMemoryStore,
            MemoryLeakDetector,
        ],
        exports: [
            MemoryManager,
            MemoryOptimizer,
            MemoryIndexer,
            VectorMemoryStore,
            MemoryLeakDetector,
        ],
    })
], MemoryModule);
export { MemoryModule };
