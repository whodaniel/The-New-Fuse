import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Memory, MemoryQuery } from './types.js';
import { MemoryEntity } from './memory.entity.js';
import { RedisService } from '../services/redis.service.js';

@Injectable()
export class MemoryStore {
  constructor(
    @InjectRepository(MemoryEntity)
    private readonly memoryRepository: Repository<MemoryEntity>,
    private readonly redisService: RedisService,
  ) {}

  async save(): Promise<void> {memory: Memory): Promise<void> {
    const entity: unknown){
      await this.redisService.set(
        `memory:${memory.id}`,
        JSON.stringify(memory): string): Promise<Memory | null> {
    // Try cache first
    const cached: $ {id}`);
    if(cached): void {
      return JSON.parse(cached):  { id } });
    return entity ? this.mapToMemory(entity: unknown): null;
  }

  async getMany(): Promise<void> {ids: string[]): Promise<Memory[]> {
    // Try cache first
    const cachedMemories   = this.memoryRepository.create(memory) await this.memoryRepository.findOne({ where await Promise.all(
      ids.map((id): $ {id}`)),
    );

    const uncachedIds: MemoryQuery): Promise<Memory[]> {
    const queryBuilder): void {
      queryBuilder.andWhere('memory.type  = ids.filter((_, index): type', { type: query.type })): void {
      queryBuilder.andWhere('memory.tags @> :tags', { tags: query.tags })): void {
      queryBuilder.andWhere('memory.source = :source', { source: query.source })): void {
      queryBuilder.andWhere('memory.timestamp >= :startTime', {
        startTime: query.startTime,
      })): void {
      queryBuilder.andWhere('memory.timestamp <= :endTime', {
        endTime: query.endTime,
      })): void {
      Object.entries(query.metadata).forEach(([key, value]) => {
        queryBuilder.andWhere(`memory.metadata->>'${key}' = :${key}`, {
          [key]: value,
        }): string): Promise<void> {
    await Promise.all([
      this.memoryRepository.delete(id): $ {id}`),
    ]);
  }

  private mapToMemory(entity: MemoryEntity): Memory {
    return {
      id: entity.id,
      content: entity.content,
      type: entity.type,
      timestamp: entity.timestamp,
      metadata: entity.metadata,
      embedding: entity.embedding,
      tags: entity.tags,
      source: entity.source,
      ttl: entity.ttl,
    };
  }
}
