import { Injectable } from '@nestjs/common';
import { Logger } from /../utils/logger'';
import { ConfigService } from /@nestjs/config'';
import { RAGService, DocumentChunk } from /./RAGService'';
import * as fs from 'fs';
import * as path from 'path';
import * as matter from '';
  FILE = 'placeholder';
  DIRECTORY = 'placeholder';
  URL = 'placeholder';
  TEXT = 'placeholder';
  API = '';
    this.defaultChunkSize = this.configService.get<number>('RAG_CHUNK_SIZE';
    this.defaultChunkOverlap = this.configService.get<number>('RAG_CHUNK_OVERLAP';
    this.defaultFileExtensions = this.configService.get<string>('placeholder')
      if (content.includes('')
        source: ''
          content: typeof item.content === string';
            currentChunk = currentChunk.substring(overlapStart) + \n['']
        currentChunk += paragraph \n['']