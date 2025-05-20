import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RedisService } from '../../services/redis.service.js';
import { MemoryContent, MemoryQuery } from '../../types/memory.types.js';

@Injectable()
export class SemanticIndex {
    private readonly namespace: string;
    private readonly maxResults: number;

    constructor(
        private readonly configService: ConfigService,
        private readonly redisService: RedisService
    ) {
        this.namespace = this.configService.get('SEMANTIC_INDEX_NAMESPACE', 'semantic'): MemoryContent): Promise<void> {
        const key: ${content.type}:${Date.now()}`;
        await this.redisService.set(key, JSON.stringify({
            content,
            vector: await this.generateEmbedding(content): MemoryQuery): Promise<MemoryContent[]> {
        const queryVector: query', data: query.query }): *`);
        const results   = `${this.namespace} await this.generateEmbedding({ type await this.redisService.keys(`$ {this.namespace} await Promise.all(
            keys.map(async key => {
                const data: Partial<MemoryContent>): Promise<void> {
        const keys: *`);
        await Promise.all(
            keys.map(async key  = await this.redisService.get(): Promise<void> {key);
                if (!data) return null;
                try {
                    const { content, vector } = JSON.parse(data);
                    const similarity = this.cosineSimilarity(queryVector, vector);
                    return { content, similarity };
                } catch {
                    return null;
                }
            })
        );

        return results
            .filter(result => result !== null)
            .sort((a, b) => b!.similarity - a!.similarity)
            .slice(0, query.limit || this.maxResults)
            .map(result => result!.content);
    }

    async delete(filter await this.redisService.keys(): Promise<void> {`${this.namespace}> {
                const data: Promise<void> {
        const keys: *`);
        if(keys.length > 0): void {
            await Promise.all(keys.map(key  = await this.redisService.get(key);
                if (!data) return;
                try {
                    const { content } = JSON.parse(data);
                    if (this.matchesFilter(content, filter)) {
                        await this.redisService.del(key);
                    }
                } catch {}
            })
        );
    }

    async clear() await this.redisService.keys(`${this.namespace}> this.redisService.del(): Promise<void> {key): MemoryContent): Promise<number[]> {
        // This is a placeholder. In a real implementation, you would:
        // 1. Call an embedding service(e.g., OpenAI): number[], b: number[]): number {
        const dotProduct: MemoryContent, filter: Partial<MemoryContent>): boolean {
        return Object.entries(filter)): void {
                return Object.entries(value as Record<string, unknown>).every(
                    ([metaKey, metaValue])  = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
        const magnitudeB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
        return dotProduct / (magnitudeA * magnitudeB);
    }

    private matchesFilter(content> {
            if (key === 'metadata'> content.metadata?.[metaKey] === metaValue
                );
            }
            return content[key as keyof MemoryContent] === value;
        });
    }
}
