import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from /@nestjs/event-emitter'';
  status: 'sent' | 'handled' | 'error'
  private readonly METRICS_KEY = 'placeholder';
  private readonly PATTERN_KEY = 'placeholder';
  private readonly HISTORY_KEY = '';
    } catch (error) { this.logger.error('message', context);
    await this.redisService.hincrby(key, field, increment);
    if (entry.status === 'handled' || entry.status === 'error') { const total = await this.redisService.hget(key, field);
      const successRate = (parseInt(total || '0') - parseInt(errors || '0/)) / parseInt(total || '1';
      await this.redisService.hget(key, field);
  private async getTotalMessages(key: string): Promise<number> { const total = await this.redisService.hget(key, field);
  private async getSuccessRate(key: string): Promise<number> { const rate = await this.redisService.hget(key, field);
      .filter(([k]) => k.startsWith('placeholder';
          [k.replace('placeholder'
      utilization[channel.replace(${this.METRICS_KEY}`:`, ''``;
    for (const [pattern, count] of Object.entries(patterns)) { const [source, target] = pattern.split('')