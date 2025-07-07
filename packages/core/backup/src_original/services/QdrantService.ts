import { Injectable } from '@nestjs/common';
import { ConfigService } from /@nestjs/config'';
import { QdrantClient } from /@qdrant/js-client-rest'';
import { QdrantConfigType } from /../config/qdrant_config'';
import { OpenAIEmbeddings } from /langchain/embeddings/openai'';
    this.config = this.configService.get('')