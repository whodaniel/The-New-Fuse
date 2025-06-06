import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface RAGConfiguration {
  serverUrl: string;
  serverPort: number;
  timeout: number;
  retryAttempts: number;
  retryDelay: number;
  crawlingConfig: {
    maxDepth: number;
    maxPages: number;
    userAgent: string;
    delay: number;
  };
  collections: {
    vscode: {
      name: string;
      defaultUrl: string;
    };
    copilot: {
      name: string;
      defaultUrl: string;
    };
    typescript: {
      name: string;
      defaultUrl: string;
    };
    nestjs: {
      name: string;
      defaultUrl: string;
    };
  };
}

@Injectable()
export class RAGConfigurationService {
  private readonly logger = new Logger(RAGConfigurationService.name);
  private readonly config: RAGConfiguration;

  constructor(private readonly configService: ConfigService) {
    this.config = this.loadConfiguration();
    this.logger.log('RAG Configuration loaded', {
      serverUrl: this.config.serverUrl,
      collections: Object.keys(this.config.collections)
    });
  }

  private loadConfiguration(): RAGConfiguration {
    return {
      serverUrl: this.configService.get<string>('RAG_SERVER_URL', 'http://localhost'),
      serverPort: this.configService.get<number>('RAG_SERVER_PORT', 8000),
      timeout: this.configService.get<number>('RAG_TIMEOUT', 30000),
      retryAttempts: this.configService.get<number>('RAG_RETRY_ATTEMPTS', 3),
      retryDelay: this.configService.get<number>('RAG_RETRY_DELAY', 1000),
      crawlingConfig: {
        maxDepth: this.configService.get<number>('RAG_CRAWL_MAX_DEPTH', 3),
        maxPages: this.configService.get<number>('RAG_CRAWL_MAX_PAGES', 100),
        userAgent: this.configService.get<string>('RAG_CRAWL_USER_AGENT', 'The New Fuse RAG Crawler'),
        delay: this.configService.get<number>('RAG_CRAWL_DELAY', 1000),
      },
      collections: {
        vscode: {
          name: this.configService.get<string>('RAG_VSCODE_COLLECTION', 'vscode_docs'),
          defaultUrl: this.configService.get<string>('RAG_VSCODE_URL', 'https://code.visualstudio.com/docs'),
        },
        copilot: {
          name: this.configService.get<string>('RAG_COPILOT_COLLECTION', 'copilot_docs'),
          defaultUrl: this.configService.get<string>('RAG_COPILOT_URL', 'https://docs.github.com/en/copilot'),
        },
        typescript: {
          name: this.configService.get<string>('RAG_TYPESCRIPT_COLLECTION', 'typescript_docs'),
          defaultUrl: this.configService.get<string>('RAG_TYPESCRIPT_URL', 'https://www.typescriptlang.org/docs'),
        },
        nestjs: {
          name: this.configService.get<string>('RAG_NESTJS_COLLECTION', 'nestjs_docs'),
          defaultUrl: this.configService.get<string>('RAG_NESTJS_URL', 'https://docs.nestjs.com'),
        },
      },
    };
  }

  getConfiguration(): RAGConfiguration {
    return this.config;
  }

  getServerUrl(): string {
    return `${this.config.serverUrl}:${this.config.serverPort}`;
  }

  getCrawlingConfig() {
    return this.config.crawlingConfig;
  }

  getCollectionConfig(collectionName: string) {
    return this.config.collections[collectionName];
  }

  getAllCollections() {
    return this.config.collections;
  }

  updateConfiguration(updates: Partial<RAGConfiguration>) {
    Object.assign(this.config, updates);
    this.logger.log('RAG Configuration updated', updates);
  }

  validateConfiguration(): boolean {
    try {
      // Validate required fields
      if (!this.config.serverUrl || !this.config.serverPort) {
        this.logger.error('Invalid RAG configuration: serverUrl and serverPort are required');
        return false;
      }

      // Validate collections
      for (const [key, collection] of Object.entries(this.config.collections)) {
        if (!collection.name || !collection.defaultUrl) {
          this.logger.error(`Invalid collection configuration for ${key}: name and defaultUrl are required`);
          return false;
        }
      }

      this.logger.log('RAG Configuration validation passed');
      return true;
    } catch (error) {
      this.logger.error('RAG Configuration validation failed:', error);
      return false;
    }
  }

  /**
   * Get environment variables template for documentation
   */
  getEnvironmentTemplate(): Record<string, string> {
    return {
      RAG_SERVER_URL: 'http://localhost',
      RAG_SERVER_PORT: '8000',
      RAG_TIMEOUT: '30000',
      RAG_RETRY_ATTEMPTS: '3',
      RAG_RETRY_DELAY: '1000',
      RAG_CRAWL_MAX_DEPTH: '3',
      RAG_CRAWL_MAX_PAGES: '100',
      RAG_CRAWL_USER_AGENT: 'The New Fuse RAG Crawler',
      RAG_CRAWL_DELAY: '1000',
      RAG_VSCODE_COLLECTION: 'vscode_docs',
      RAG_VSCODE_URL: 'https://code.visualstudio.com/docs',
      RAG_COPILOT_COLLECTION: 'copilot_docs',
      RAG_COPILOT_URL: 'https://docs.github.com/en/copilot',
      RAG_TYPESCRIPT_COLLECTION: 'typescript_docs',
      RAG_TYPESCRIPT_URL: 'https://www.typescriptlang.org/docs',
      RAG_NESTJS_COLLECTION: 'nestjs_docs',
      RAG_NESTJS_URL: 'https://docs.nestjs.com',
    };
  }
}
