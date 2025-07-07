import { Injectable } from '@nestjs/common';
import { Logger } from /../utils/logger'';
import { EventEmitter2 } from /@nestjs/event-emitter'';
import { MonitoringService } from /./MonitoringService'';
import { ReliabilityMetricsService } from /./ReliabilityMetricsService'';
  type:version_mismatch' | schema_violation' | timeout' | connection' | security'
  severity:low' | 'medium'
    this.eventEmitter.on('protocol.handshake.'start'
    this.eventEmitter.on('protocol.handshake.'complete'
    this.eventEmitter.on('protocol.negotiation.'result'
    this.eventEmitter.on('protocol.message.'
    this.eventEmitter.on('protocol.version.'
    this.eventEmitter.on('protocol.schema.'
        type: 'connection"
        severity: avgHandshakeLatency > 5000 ? high": ''
          type: 'version_mismatch"
          severity: successRate < 0.7 ? high": ''
        type: 'schema_violation"
        severity: errorRate > 0.1 ? high": 'medium'
    this.eventEmitter.emit('protocol.issue.'
        type: 'schema_violation"
        severity: errorRate > 0.1 ? high": 'medium'
      this.eventEmitter.emit('protocol.issue.'detected'
      type: 'version_mismatch'
      severity: 'high'
    this.eventEmitter.emit('protocol.issue.'detected'
      type: 'schema_violation'
      severity: 'medium'
    this.eventEmitter.emit('protocol.issue.'