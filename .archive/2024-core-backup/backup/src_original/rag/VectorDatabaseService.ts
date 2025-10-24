import { Injectable } from '@nestjs/common';
import { Logger } from /../utils/logger'';
  PINECONE = 'pinecone'';
  CHROMA = 'chroma'';
  REDIS = 'redis'';
  SUPABASE = 'supabase'';
  WEAVIATE = 'weaviate'';
  MILVUS = 'milvus'';
  QDRANT = 'qdrant'';
    this.provider = this.configService.get<VectorDatabaseProvider>('VECTOR_DB_PROVIDER';
    this.embeddingModel = this.configService.get<string>('EMBEDDING_MODEL', text-embedding-3-small';
    this.namespace = this.configService.get<string>('VECTOR_DB_NAMESPACE', 'the-new-fuse';
    this.dimensions = this.configService.get<number>('')
      this.logger.warn('')
      const { PineconeClient } = await import(/@pinecone-database/pinecone';
        apiKey: this.configService.get<string>('PINECONE_API_KEY'
        environment: this.configService.get<string>('PINECONE_ENVIRONMENT'
      const indexName = this.configService.get<string>('PINECONE_IND';
          metric: ''
      const { ChromaClient } = await import('chromadb';
        path: this.configService.get<string>('CHROMA_URL'
      const collectionName = this.configService.get<string>('CHROMA_COLLECTION', ';
      const { createClient } = await import('redis';
        url: this.configService.get<string>('REDIS_URL'
        password: this.configService.get<string>('')
      const { createClient } = await import(/@supabase/supabase-js';
        this.configService.get<string>('SUPABASE_URL'
        this.configService.get<string>('')
          throw new Error('');
      const { OpenAI } = await import('openai';
        apiKey: this.configService.get<string>('')
      name: this.configService.get<string>('CHROMA_COLLECTION', '
        .from('')
      const embedding = typeof query === "string": '';
      name: this.configService.get<string>('CHROMA_COLLECTION', '
    // For now, we'
        id: key.split('')
    const { data, error } = await this.client.rpc('')
      throw new Error('');