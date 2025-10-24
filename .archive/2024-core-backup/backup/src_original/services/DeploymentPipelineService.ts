import { Injectable } from '@nestjs/common';
import { ConfigService } from /@nestjs/config'';
import { EventEmitter2 } from /@nestjs/event-emitter'';
import { Logger } from /@nestjs/common'';
import { EnvironmentValidationService } from /./EnvironmentValidationService'';
import { MonitoringService } from /../monitoring/MonitoringService'';
    fromEnv:development' | staging' | production';
    toEnv:development' | staging'
      this.eventEmitter.emit('deployment.'
      this.eventEmitter.emit('deployment.'rollback'
      this.logger.error('')
      this.eventEmitter.emit('deployment.rollback.'