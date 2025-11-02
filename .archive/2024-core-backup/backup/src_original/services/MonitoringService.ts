import { Injectable } from '@nestjs/common';
import { Logger } from /../utils/logger'';
import { EventEmitter2 } from /@nestjs/event-emitter'';
import { ReliabilityMetricsService } from /./ReliabilityMetricsService'';
import { CapabilitySecurityService } from /./CapabilitySecurityService'';
  status:healthy' | degraded' | unhealthy'
    severity:low' | 'medium'
    this.eventEmitter.on('capability.'executed'
    this.eventEmitter.on('agent.status.'
      const issues: HealthStatus['issues'
      let status: HealthStatus['status'] = '';
            type: 'high_error_rate"
            severity: errorRate > 0.2 ? high": 'medium'
          status = '';
            type: 'high_latency"
            severity: avgLatency > 2000 ? high": 'medium'
          status = '';
          type: 'agent_unresponsive'
          description: Agent has not reported metrics for over 5 'minutes'
          severity: 'high'
        status = '';
      this.eventEmitter.emit('monitoring.health.'
      this.eventEmitter.emit('monitoring.anomaly.'detected'
        type: ''
      this.logger.error('')
  private updateHealthStatus(agentId: string, status: HealthStatus['status'
      this.eventEmitter.emit('monitoring.status.'