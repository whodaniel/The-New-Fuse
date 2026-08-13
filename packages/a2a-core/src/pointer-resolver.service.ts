import { Injectable, Logger } from '@nestjs/common';
import { VectorDatabaseService } from '@the-new-fuse/core-vector-db';
import * as fs from 'fs/promises';
import { TNFResourcePointer } from './signature-wrapper.js';

@Injectable()
export class PointerResolverService {
 private static readonly serviceName = 'PointerResolverService';
 private readonly logger = new Logger(PointerResolverService.serviceName);

  constructor(private readonly vectorDbService: VectorDatabaseService) {}

  /**
   * Resolves a TNF Resource Pointer (TRP) to its actual content.
   * This prevents "All-in-Memory" bottlenecks by fetching data only when needed.
   */
  async resolve(pointer: TNFResourcePointer): Promise<any> {
    const { uri } = pointer;
    this.logger.debug(`Resolving pointer: ${uri}`);

    if (uri.startsWith('pgvector://')) {
      return this.resolvePgVector(uri);
    } else if (uri.startsWith('file://')) {
      return this.resolveFile(uri);
    } else if (uri.startsWith('trp://')) {
      return this.resolveTrp(uri);
    } else {
      throw new Error(`Unsupported pointer URI scheme: ${uri}`);
    }
  }

  private async resolvePgVector(uri: string): Promise<any> {
    // Expected format: pgvector://collection_name/document_id
    const parts = uri.replace('pgvector://', '').split('/');
    if (parts.length < 2) {
      throw new Error(`Invalid pgvector URI: ${uri}. Expected pgvector://collection/id`);
    }

    const [collection, id] = parts;
    const document = await this.vectorDbService.getDocument(collection, id);

    if (!document) {
      throw new Error(`Resource not found in pgvector: ${uri}`);
    }

    return document.content;
  }

  private async resolveFile(uri: string): Promise<any> {
    const filePath = uri.replace('file://', '');
    try {
      const content = await fs.readFile(filePath, 'utf8');
      return content;
    } catch (error) {
      throw new Error(`Failed to read file from pointer: ${uri}. ${(error as Error).message}`);
    }
  }

  private async resolveTrp(uri: string): Promise<any> {
    // Internal TNF Relay Protocol resolution
    // For now, this could be a proxy to other services or a specific relay-backed store
    throw new Error(`TRP scheme resolution not yet implemented: ${uri}`);
  }
}
