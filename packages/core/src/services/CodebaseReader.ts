import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { QdrantService } from './QdrantService';
import { CodebaseReadingConfigType } from '../config/codebase_reading_config';
import * as path from 'path';
import * as fs from 'fs/promises';
import { glob } from 'glob';

export interface CodebaseFile {
  path: string;
  content: string;
  language: string;
  size: number;
}

@Injectable()
export class CodebaseReader {
  private config: CodebaseReadingConfigType;

  constructor(
    private readonly configService: ConfigService,
    private readonly eventEmitter: EventEmitter2,
    private readonly qdrantService: QdrantService
  ) {
    this.config = this.configService.get('codebaseReading') || {};
  }

  async readCodebase(rootPath: string, fileExtensions: string[]): Promise<CodebaseFile[]> {
    const files: CodebaseFile[] = [];

    const pattern = `**/*+(${fileExtensions.join('|')})`;
    const filePaths = await glob(pattern, {
      cwd: rootPath,
      ignore: ['node_modules/**', 'dist/**', 'build/**', '.git/**']
    });

    for (const filePath of filePaths) {
      try {
        const fullPath = path.join(rootPath, filePath);
        const content = await fs.readFile(fullPath, 'utf-8');
        const stats = await fs.stat(fullPath);

        files.push({
          path: filePath,
          content,
          language: this.getLanguage(filePath),
          size: stats.size
        });

        this.eventEmitter.emit('codebase.file.read', { path: filePath });
      } catch (error) {
        console.error(`Error reading file ${filePath}:`, error);
      }
    }

    return files;
  }

  private getLanguage(filePath: string): string {
    const ext = path.extname(filePath).toLowerCase();
    const languageMap: Record<string, string> = {
      '.ts': 'typescript',
      '.js': 'javascript',
      '.py': 'python',
      '.java': 'java',
      '.go': 'go',
      '.rs': 'rust',
      '.cpp': 'cpp',
      '.c': 'c',
      '.rb': 'ruby',
      '.php': 'php',
      '.swift': 'swift',
      '.kt': 'kotlin'
    };
    return languageMap[ext] || 'unknown';
  }

  async indexCodebase(files: CodebaseFile[]): Promise<void> {
    for (const file of files) {
      await this.qdrantService.indexDocument({
        id: file.path,
        content: file.content,
        metadata: {
          language: file.language,
          size: file.size,
          path: file.path
        }
      });
    }
  }

  async searchCodebase(query: string, limit: number = 10): Promise<CodebaseFile[]> {
    const results = await this.qdrantService.search(query, limit);
    return results.map(r => r.payload as CodebaseFile);
  }
}
