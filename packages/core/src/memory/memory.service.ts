import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Memory, MemoryType } from './memory.entity';

export interface CreateMemoryDto {
  content: string;
  type: MemoryType;
  metadata?: Record<string, any>;
  importance?: number;
  tags?: string[];
}

export interface UpdateMemoryDto {
  content?: string;
  type?: MemoryType;
  metadata?: Record<string, any>;
  importance?: number;
  tags?: string[];
}

@Injectable()
export class MemoryService {
  private readonly logger = new Logger(MemoryService.name);

  constructor(
    @InjectRepository(Memory)
    private readonly memoryRepository: Repository<Memory>
  ) {}

  async createMemory(createMemoryDto: CreateMemoryDto): Promise<Memory> {
    try {
      const memory = this.memoryRepository.create(createMemoryDto);
      return await this.memoryRepository.save(memory);
    } catch (error) {
      this.logger.error('Failed to create memory:', error);
      throw error;
    }
  }

  async findMemoryById(id: string): Promise<Memory | null> {
    try {
      return await this.memoryRepository.findOne({ where: { id } });
    } catch (error) {
      this.logger.error('Failed to find memory:', error);
      throw error;
    }
  }

  async findMemoriesByType(type: MemoryType): Promise<Memory[]> {
    try {
      return await this.memoryRepository.find({ 
        where: { type },
        order: { createdAt: 'DESC' }
      });
    } catch (error) {
      this.logger.error('Failed to find memories by type:', error);
      throw error;
    }
  }

  async updateMemory(id: string, updateMemoryDto: UpdateMemoryDto): Promise<Memory | null> {
    try {
      await this.memoryRepository.update(id, updateMemoryDto);
      return await this.findMemoryById(id);
    } catch (error) {
      this.logger.error('Failed to update memory:', error);
      throw error;
    }
  }

  async deleteMemory(id: string): Promise<void> {
    try {
      await this.memoryRepository.delete(id);
    } catch (error) {
      this.logger.error('Failed to delete memory:', error);
      throw error;
    }
  }

  async findAllMemories(): Promise<Memory[]> {
    try {
      return await this.memoryRepository.find({
        order: { createdAt: 'DESC' }
      });
    } catch (error) {
      this.logger.error('Failed to find all memories:', error);
      throw error;
    }
  }

  async searchMemories(query: string): Promise<Memory[]> {
    try {
      return await this.memoryRepository
        .createQueryBuilder('memory')
        .where('memory.content ILIKE :query', { query: `%${query}%` })
        .orderBy('memory.createdAt', 'DESC')
        .getMany();
    } catch (error) {
      this.logger.error('Failed to search memories:', error);
      throw error;
    }
  }
}