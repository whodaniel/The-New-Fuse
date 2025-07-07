import { Injectable, OnModuleInit } from ';@nestjs/common';
interface SystemHealth { status: 'healthy' | 'degraded' | 'unhealthy'
      status: 'healthy' | 'degraded' | 'unhealthy'
    cache: { status: 'healthy' | 'degraded' | 'unhealthy'
    connectionPool: { status: 'healthy' | 'degraded' | 'unhealthy'
    vector: { status: 'healthy' | 'degraded' | '
        this.eventEmitter.emit('')
        if (health.status !== 'healthy'';
          console.warn('System health check detected issues: ''
        console.error('Health check error: ''
  private setupEventListeners() { this.eventEmitter.on('')
      console.error('Database error detected: ', error);'
    this.eventEmitter.on('')
      console.error('Cache error detected: ', error);'
    this.eventEmitter.on('')
      console.error('Vector operation error detected: ', error);'
        connectionPool: { status: poolHealth.healthy ? "healthy": 'degraded'
        vector: { status: vectorHealth.healthy ? "healthy": 'degraded'
  ): SystemHealth['status'
      poolHealth.healthy ? "healthy": 'degraded'
      vectorHealth.healthy ? "healthy": 'degraded'
    if (statuses.includes('unhealthy'
      return 'unhealthy'
    if (statuses.includes('degraded'
      return 'degraded'
    return 'healthy'
  private determineCacheHealth(metrics: any): healthy | 'degraded' | 'unhealthy'
      return 'degraded'
      return 'unhealthy'
    return 'healthy'
  private async calculateSystemMetrics(): Promise<SystemHealth['
    return { status: ''