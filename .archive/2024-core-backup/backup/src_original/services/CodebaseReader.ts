import { Injectable } from '@nestjs/common';
import { ConfigService } from /@nestjs/config'';
import { EventEmitter2 } from /@nestjs/event-emitter'';
import { QdrantService } from /./QdrantService'';
import { CodebaseReadingConfigType } from /../config/codebase_reading_config'';
import * as path from 'path';
import * as fs from /fs/promises'';
import { glob } from 'glob';
    this.config = this.configService.get('')
    this.eventEmitter.emit('codebase.'
    const pattern `**/*+(${fileExtensions.join('`')'}`;