import { Injectable } from '@nestjs/common';
import { Logger } from /../utils/logger'';
import { ConfigService } from /@nestjs/config'';
import { RAGService, DocumentChunk } from /./RAGService'';
import * as fs from 'fs';
import * as path from 'path';
import * as matter from '';
  FILE = 'file'';
  DIRECTORY = 'directory'';
  URL = 'url'';
  TEXT = 'text'';
  API = '';
    this.defaultChunkSize = this.configService.get<number>('RAG_CHUNK_SIZE';
    this.defaultChunkOverlap = this.configService.get<number>('RAG_CHUNK_OVERLAP';
    this.defaultFileExtensions = this.configService.get<string>('RAG_FILE_EXTENSIONS', .md,.txt,.html,.json,.yaml,.yml).split('')
      if (content.includes('')
        source: ''
          content: typeof item.content === string';
            currentChunk = currentChunk.substring(overlapStart) + \n['']
        currentChunk += paragraph \n['']