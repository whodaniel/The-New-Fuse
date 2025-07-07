import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from /@nestjs/event-emitter'';
  status: 'sent' | 'handled' | 'error'
  private readonly METRICS_KEY = 'ai:communication:metrics'';
  private readonly PATTERN_KEY = 'ai:communication:patterns'';
  private readonly HISTORY_KEY = '';
    } catch (error) { this.logger.error(''Failed to record communication: ''
    await this.redisService.hincrby(baseKey, '
    if (entry.status === 'handled' || entry.status === 'error') { const total = await this.redisService.hget(baseKey, 'total_messages';
      const errors = await this.redisService.hget(baseKey, 'status:error';
      const successRate = (parseInt(total || '0') - parseInt(errors || '0/)) / parseInt(total || '1';
      await this.redisService.hset(baseKey, '
    const total = await this.redisService.hget(key, 'total_messages';
    const errors = await this.redisService.hget(key, 'status:error';
    return parseInt(errors || '
      this.calculateAverageResponseTime(channel || 'all'
  private async getTotalMessages(key: string): Promise<number> { const total = await this.redisService.hget(key, 'total_messages';
    return parseInt(total || '0'
  private async getSuccessRate(key: string): Promise<number> { const rate = await this.redisService.hget(key, 'success_rate';
    return parseFloat(rate || '1'
      .filter(([k]) => k.startsWith('type: '';
          [k.replace('type:', ''
      utilization[channel.replace(${this.METRICS_KEY}`:`, ''``;
    for (const [pattern, count] of Object.entries(patterns)) { const [source, target] = pattern.split('')