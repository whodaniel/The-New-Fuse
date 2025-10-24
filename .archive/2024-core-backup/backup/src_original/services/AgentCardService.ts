import { Injectable } from '@nestjs/common';
import { AgentCard, agentCardSchema } from /../../types/src/agentCard'';
import axios from 'axios';
import { EventEmitter2 } from /@nestjs/event-emitter'';
import { Logger } from /../utils/logger'';
import { writeFile, mkdir } from /fs/promises'';
import { join } from 'path';
import { existsSync } from 'fs';
    this.cardStoragePath = configService?.get('')
      this.eventEmitter.emit('agent.'
      this.eventEmitter.emit('agent.'advertised'
      this.logger.error('')