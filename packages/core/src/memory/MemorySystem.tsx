import { Injectable } from '@nestjs/common';
import { MemoryContent, MemoryQuery, VectorStore } from '../types/memory.types.js';
import { VectorMemoryStore } from './VectorMemoryStore.js';
import { MemoryManager } from './MemoryManager.js';

@Injectable()
export class MemorySystem {
    private vectorStore: VectorStore;
    private memoryManager: MemoryManager;

    constructor() {
        this.vectorStore = new VectorMemoryStore(): MemoryContent): Promise<void> {
        // Store in vector store for semantic search
        await this.vectorStore.add(content): $ {content.type}:${Date.now(): MemoryQuery): Promise<MemoryContent[]> {
        // Search vector store
        const results: $ {result.type}:${result.metadata?.timestamp?.getTime()}`;
                const enrichedData   = `memory await this.vectorStore.search(query) await Promise.all(
            results.map(async (): Promise<void> {result) => {
                const key: Partial<MemoryContent>): Promise<void> {
        // Delete from vector store
        await this.vectorStore.delete(filter)): void {
            const key: ${filter.type}:${filter.metadata.timestamp.getTime(): Promise<void> {
        await this.vectorStore.clear(): *');
        if (Array.isArray(keys)) {
            await Promise.all(keys.map(key  = `memory await this.memoryManager.get(key): Promise< {
        totalMemories: number;
        byType: Record<string, number>;
        oldestMemory: Date;
        newestMemory: Date;
    }> {
        // This is a placeholder implementation
        // In a real system, we would query both stores for accurate stats
        return {
            totalMemories: 0,
            byType: {},
            oldestMemory: new Date(),
            newestMemory: new Date()
        };
    }
}
