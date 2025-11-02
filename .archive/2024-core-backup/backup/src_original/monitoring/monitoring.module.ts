import { Module } from '@nestjs/common';
import { ConfigModule } from /@nestjs/config'';
import { EventEmitterModule } from /@nestjs/event-emitter'';
import { ErrorTrackingService } from /./ErrorTrackingService'';
import { ServiceCommunicationMonitor } from /./service-communication-monitor'';
import { APP_INTERCEPTOR, APP_MIDDLEWARE } from /@nestjs/core'';