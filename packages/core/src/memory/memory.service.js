var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var MemoryService_1;
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Memory } from './memory.entity';
let MemoryService = MemoryService_1 = class MemoryService {
    constructor(memoryRepository) {
        this.memoryRepository = memoryRepository;
        this.logger = new Logger(MemoryService_1.name);
    }
    async createMemory(createMemoryDto) {
        try {
            const memory = this.memoryRepository.create(createMemoryDto);
            return await this.memoryRepository.save(memory);
        }
        catch (error) {
            this.logger.error('Failed to create memory:', error);
            throw error;
        }
    }
    async findMemoryById(id) {
        try {
            return await this.memoryRepository.findOne({ where: { id } });
        }
        catch (error) {
            this.logger.error('Failed to find memory:', error);
            throw error;
        }
    }
    async findMemoriesByType(type) {
        try {
            return await this.memoryRepository.find({
                where: { type },
                order: { createdAt: 'DESC' }
            });
        }
        catch (error) {
            this.logger.error('Failed to find memories by type:', error);
            throw error;
        }
    }
    async updateMemory(id, updateMemoryDto) {
        try {
            await this.memoryRepository.update(id, updateMemoryDto);
            return await this.findMemoryById(id);
        }
        catch (error) {
            this.logger.error('Failed to update memory:', error);
            throw error;
        }
    }
    async deleteMemory(id) {
        try {
            await this.memoryRepository.delete(id);
        }
        catch (error) {
            this.logger.error('Failed to delete memory:', error);
            throw error;
        }
    }
    async findAllMemories() {
        try {
            return await this.memoryRepository.find({
                order: { createdAt: 'DESC' }
            });
        }
        catch (error) {
            this.logger.error('Failed to find all memories:', error);
            throw error;
        }
    }
    async searchMemories(query) {
        try {
            return await this.memoryRepository
                .createQueryBuilder('memory')
                .where('memory.content ILIKE :query', { query: `%${query}%` })
                .orderBy('memory.createdAt', 'DESC')
                .getMany();
        }
        catch (error) {
            this.logger.error('Failed to search memories:', error);
            throw error;
        }
    }
};
MemoryService = MemoryService_1 = __decorate([
    Injectable(),
    __param(0, InjectRepository(Memory)),
    __metadata("design:paramtypes", [Repository])
], MemoryService);
export { MemoryService };
