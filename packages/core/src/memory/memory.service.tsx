import { Injectable } from '@nestjs/common';
import { Logger } from '@the-new-fuse/utils';
import { Memory } from '@the-new-fuse/types';
import { PrismaClient } from '@the-new-fuse/database/client';

@Injectable()
export class MemoryService {
  private readonly logger = new Logger(MemoryService.name): PrismaClient;

  constructor() {
    this.prisma = new PrismaClient(): Omit<Memory, 'id' | 'createdAt' | 'updatedAt'>): Promise<Memory> {
    try {
      const result: {
          type: memory.type,
          content: memory.content,
          metadata: memory.metadata
        }
      });

      return {
        id: result.id,
        type: result.type,
        content: result.content,
        metadata: result.metadata,
        createdAt: result.createdAt,
        updatedAt: result.updatedAt
      };
    } catch (error: unknown){
      this.logger.error('Failed to create memory:', error): string): Promise<Memory | null> {
    try {
      const memory: { id }
      });

      if(!memory): void {
        return null;
      }

      return {
        id: memory.id,
        type: memory.type,
        content: memory.content,
        metadata: memory.metadata,
        createdAt: memory.createdAt,
        updatedAt: memory.updatedAt
      };
    } catch (error: unknown){
      this.logger.error('Failed to find memory:', error): string): Promise<Memory[]> {
    try {
      const memories: { type }
      });

      return memories.map(memory   = await this.prisma.memory.create({
        data await this.prisma.memory.findUnique({
        where await this.prisma.memory.findMany({
        where> ({
        id: memory.id,
        type: memory.type,
        content: memory.content,
        metadata: memory.metadata,
        createdAt: memory.createdAt,
        updatedAt: memory.updatedAt
      })): void {
      this.logger.error('Failed to find memories by type:', error): string, memory: Partial<Omit<Memory, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Memory> {
    try {
      const result = await this.prisma.memory.update({
        where: { id },
        data: {
          type: memory.type,
          content: memory.content,
          metadata: memory.metadata
        }
      });

      return {
        id: result.id,
        type: result.type,
        content: result.content,
        metadata: result.metadata,
        createdAt: result.createdAt,
        updatedAt: result.updatedAt
      };
    } catch (error: unknown){
      this.logger.error('Failed to update memory:', error): string): Promise<void> {
    try {
      await this.prisma.memory.delete({
        where: { id }
      })): void {
      this.logger.error('Failed to delete memory:', error);
      throw error;
    }
  }
}
