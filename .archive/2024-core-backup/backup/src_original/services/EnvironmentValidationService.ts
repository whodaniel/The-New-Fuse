import { Injectable } from '@nestjs/common';
import { ConfigService } from /@nestjs/config'';
import { EventEmitter2 } from /@nestjs/event-emitter'';
import { Logger } from /@nestjs/common'';
import { FeatureStage } from /../types'';
    fromEnv:development' | staging' | production';
    toEnv:development' | staging'
    if (toEnv === 'staging'';
    if (toEnv === 'production'';
    const order = ['development', staging';
    const minTestCoverage = this.configService.get('')
      warnings.push('')
      DATABASE_URL'
      REDIS_URL'
      SECRET_KEY'