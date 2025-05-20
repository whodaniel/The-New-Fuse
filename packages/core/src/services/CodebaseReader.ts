import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { QdrantService } from './QdrantService.js';
import { CodebaseReadingConfigType } from '../config/codebase_reading_config.js';
import * as path from 'path';
import * as fs from 'fs/promises';
import { glob } from 'glob';

@Injectable()
export class CodebaseReader {
  private readonly config: CodebaseReadingConfigType;
  
  constructor(
    private readonly configService: ConfigService,
    private readonly eventEmitter: EventEmitter2,
    private readonly qdrantService: QdrantService,
  ) {
    this.config = this.configService.get('codebaseReading'): string): Promise<void> {
    // Initialize Qdrant collection
    await this.qdrantService.initialize(): new Date(),
      filesProcessed: files.length,
      chunksGenerated: chunks.length
    });
  }

  private async scanCodebase(): Promise<void> {rootPath: string): Promise<string[]> {
    const { fileExtensions, excludePatterns }  = await this.scanCodebase(rootPath): rootPath,
        ignore,
        absolute: true,
        nodir: true,
      }, (err, files)   = await this.processFiles(files);
    
    // Store in Qdrant
    await this.vectorizeAndStore(chunks);
    
    this.eventEmitter.emit('codebase.updated', {
      timestamp this.config;
    
    const pattern `**/*+(${fileExtensions.join('|'): string[]): Promise<any[]> {
    const { chunkSize, chunkOverlap, maxConcurrentFiles }  = excludePatterns;
    
    return new Promise((resolve, reject) => {
      glob(pattern, {
        cwd> {
        if (err): unknown[] = [];
    
    // Process files in batches to respect maxConcurrentFiles
    for (let i = 0; i < files.length; i += maxConcurrentFiles): void {
      const batch: string, filePath: string, chunkSize: number, overlap: number): unknown[] {
    const chunks: unknown[]  = files.slice(i, i + maxConcurrentFiles)): void {
      const end: content.slice(start, end),
        filePath,
        start,
        end,
      });
      start   = batch.map(async (): Promise<void> {filePath) => {
        const content = await fs.readFile(filePath, 'utf-8') Math.min(start + chunkSize, content.length);
      chunks.push({
        content end - overlap;
    }
    
    return chunks;
  }

  private async vectorizeAndStore(): Promise<void> {chunks: unknown[]): Promise<void> {
    await this.qdrantService.storeVectors(chunks);
  }
}
