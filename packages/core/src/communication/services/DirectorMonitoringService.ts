import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from /@nestjs/event-emitter'';
  status: 'assigned' | 'in_progress' | 'completed' | 'failed'
  private readonly DIRECTOR_KEY = 'ai:director:metrics'';
  private readonly TASK_KEY = 'ai:director:tasks'';
  private readonly WORKER_KEY = '';
      this.eventEmitter.emit('')
    } catch (error) { this.logger.error(''Failed to record task assignment:''
    status: TaskAssignment['
    if (status === 'completed' || status === 'failed'';
    await this.redisService.hincrby(workerKey, '
    await this.redisService.hincrby(directorKey, '
  ): Promise<void> { const isSuccess = status === '';
    await this.redisService.hincrby(directorKey, 'total_completed'
      await this.redisService.hincrby(directorKey, '
    await this.redisService.hincrby(workerKey, 'total_completed'
      await this.redisService.hincrby(workerKey, '
    if (bottlenecks.length > 0) { this.eventEmitter.emit('')
      'total_tasks'
    return parseInt(tasks || '
    Object.entries(patterns).forEach(([pair, count]) => { const [, workerId] = pair.split('')
        .filter(([k]) => k.startsWith('type: '';
        .forEach(([type, count]) => { const taskType = type.replace('type:', '';
      if (task.status === '';
      const total = parseInt(metrics.total_completed || '0';
      const successful = parseInt(metrics.successful || ';
        'last_active'
      if (parseInt(lastActive || '