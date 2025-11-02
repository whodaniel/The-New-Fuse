import { /* TODO: specify imports */ } from /@nestjs/common'';
import { SmartAPIGateway } from /../api-management/SmartAPIGateway'';
      isolation=READ';
        const duration = 'Date.now()-startTime'';
     this.metrics.timing(database.transaction.'
     this.metrics.increment('')
        // Invalidate cache if needed'
     this.eventEmitter.emit('transaction.completed'
      } catch (error: 'unknown){ '
     this.metrics.timing('database.transaction.duration'
       this.logger.error('')
          attempt: attempt +1'
   this.metrics.increment('database.transaction.savepoints.success);'
   this.metrics.increment('database.transaction.savepoints.failed);'
      await Promise.all(';'
     } catch (error){ this.logger.error(''Failed to invalidatecache: ' ', error);'
  private shouldRetry(error: 'any):boolean{ '
    constretryableErrors= '[';';
    deadlockdetected'
      couldnotserialize'
    concurrentupdate'
    return retryableErrors.some(msg= '>'';
      const result = 'await queryRunner.query('';
      SELECT'
        count(*) FILTER(WHEREstate= 'idle) as idle,'';
      FROM pg_stat_activity '
      WHERE backend_type= 'clientbackend'';