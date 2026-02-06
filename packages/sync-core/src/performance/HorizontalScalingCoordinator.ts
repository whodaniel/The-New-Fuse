// Using a generic Redis interface for compatibility
interface RedisService {
  setex(key: string, seconds: number, value: string): Promise<string>;
  get(key: string): Promise<string | null>;
  sadd(key: string, member: string): Promise<number>;
  smembers(key: string): Promise<string[]>;
  srem(key: string, member: string): Promise<number>;
  del(key: string): Promise<number>;
  lpush(key: string, value: string): Promise<number>;
  lrange(key: string, start: number, stop: number): Promise<string[]>;
  publish(channel: string, message: string): Promise<number>;
}
import { Logger } from '@the-new-fuse/core-monitoring';

export interface ScalingInstance {
  instanceId: string;
  hostname: string;
  port: number;
  capabilities: string[];
  load: number;
  lastHeartbeat: Date;
  status: 'active' | 'draining' | 'inactive';
}

export interface ScalingCoordinationConfig {
  instanceId: string;
  heartbeatInterval: number;
  loadThreshold: number;
  redistributionDelay: number;
  clusterKey: string;
}

/**
 * Coordinates horizontal scaling across multiple sync instances using Redis clustering
 * Integrates with existing Redis infrastructure for distributed coordination
 */
export class HorizontalScalingCoordinator {
  private readonly logger = new Logger('HorizontalScalingCoordinator');
  private heartbeatTimer?: NodeJS.Timeout;
  private redistributionTimer?: NodeJS.Timeout;
  private currentLoad = 0;

  constructor(
    private readonly redisService: RedisService,
    private readonly config: ScalingCoordinationConfig
  ) {}

  /**
   * Initialize scaling coordination with existing Redis cluster
   */
  async initialize(): Promise<void> {
    try {
      await this.registerInstance();
      await this.startHeartbeat();
      await this.startLoadMonitoring();

      this.logger.info('Horizontal scaling coordinator initialized', {
        instanceId: this.config.instanceId,
        clusterKey: this.config.clusterKey,
      });
    } catch (error) {
      this.logger.error('Failed to initialize scaling coordinator', { error });
      throw error;
    }
  }

  /**
   * Register this instance in the Redis cluster
   */
  private async registerInstance(): Promise<void> {
    const instance: ScalingInstance = {
      instanceId: this.config.instanceId,
      hostname: process.env.HOSTNAME || 'localhost',
      port: parseInt(process.env.PORT || '3000'),
      capabilities: ['file-sync', 'agent-sync', 'template-sync'],
      load: 0,
      lastHeartbeat: new Date(),
      status: 'active',
    };

    const key = `${this.config.clusterKey}:instances:${this.config.instanceId}`;
    await this.redisService.setex(key, 60, JSON.stringify(instance));

    // Add to active instances set
    await this.redisService.sadd(`${this.config.clusterKey}:active`, this.config.instanceId);
  }

  /**
   * Start heartbeat to maintain instance registration
   */
  private async startHeartbeat(): Promise<void> {
    this.heartbeatTimer = setInterval(async () => {
      try {
        await this.sendHeartbeat();
      } catch (error) {
        this.logger.error('Heartbeat failed', { error });
      }
    }, this.config.heartbeatInterval);
  }

  /**
   * Send heartbeat with current load metrics
   */
  private async sendHeartbeat(): Promise<void> {
    const instance: Partial<ScalingInstance> = {
      load: this.currentLoad,
      lastHeartbeat: new Date(),
      status: this.currentLoad > this.config.loadThreshold ? 'draining' : 'active',
    };

    const key = `${this.config.clusterKey}:instances:${this.config.instanceId}`;
    const existingData = await this.redisService.get(key);

    if (existingData) {
      const existing = JSON.parse(existingData);
      const updated = { ...existing, ...instance };
      await this.redisService.setex(key, 60, JSON.stringify(updated));
    }
  }

  /**
   * Get all active instances in the cluster
   */
  async getActiveInstances(): Promise<ScalingInstance[]> {
    const activeIds = await this.redisService.smembers(`${this.config.clusterKey}:active`);
    const instances: ScalingInstance[] = [];

    for (const instanceId of activeIds) {
      const key = `${this.config.clusterKey}:instances:${instanceId}`;
      const data = await this.redisService.get(key);

      if (data) {
        const instance = JSON.parse(data) as ScalingInstance;
        // Check if instance is still alive (heartbeat within last 2 minutes)
        const heartbeatAge = Date.now() - new Date(instance.lastHeartbeat).getTime();

        if (heartbeatAge < 120000) {
          // 2 minutes
          instances.push(instance);
        } else {
          // Remove stale instance
          await this.removeStaleInstance(instanceId);
        }
      }
    }

    return instances;
  }

  /**
   * Remove stale instances from cluster
   */
  private async removeStaleInstance(instanceId: string): Promise<void> {
    await this.redisService.srem(`${this.config.clusterKey}:active`, instanceId);
    await this.redisService.del(`${this.config.clusterKey}:instances:${instanceId}`);

    this.logger.warn('Removed stale instance from cluster', { instanceId });
  }

  /**
   * Distribute work across available instances based on load
   */
  async distributeWork(workType: string, workload: any): Promise<string> {
    const instances = await this.getActiveInstances();
    const availableInstances = instances.filter(
      (i) =>
        i.status === 'active' &&
        i.capabilities.includes(workType) &&
        i.load < this.config.loadThreshold
    );

    if (availableInstances.length === 0) {
      throw new Error(`No available instances for work type: ${workType}`);
    }

    // Select instance with lowest load
    const selectedInstance = availableInstances.reduce((prev, current) =>
      prev.load < current.load ? prev : current
    );

    // Queue work for selected instance
    const workKey = `${this.config.clusterKey}:work:${selectedInstance.instanceId}`;
    await this.redisService.lpush(
      workKey,
      JSON.stringify({
        id: `${Date.now()}-${Math.random()}`,
        type: workType,
        payload: workload,
        assignedAt: new Date(),
        assignedBy: this.config.instanceId,
      })
    );

    this.logger.debug('Work distributed to instance', {
      workType,
      targetInstance: selectedInstance.instanceId,
      currentLoad: selectedInstance.load,
    });

    return selectedInstance.instanceId;
  }

  /**
   * Get work assigned to this instance
   */
  async getAssignedWork(): Promise<any[]> {
    const workKey = `${this.config.clusterKey}:work:${this.config.instanceId}`;
    const workItems = await this.redisService.lrange(workKey, 0, -1);

    // Clear the queue after retrieving
    if (workItems.length > 0) {
      await this.redisService.del(workKey);
    }

    return workItems.map((item) => JSON.parse(item));
  }

  /**
   * Update current load metrics
   */
  updateLoad(load: number): void {
    this.currentLoad = Math.max(0, Math.min(100, load));
  }

  /**
   * Start monitoring load and trigger redistribution if needed
   */
  private async startLoadMonitoring(): Promise<void> {
    this.redistributionTimer = setInterval(async () => {
      try {
        if (this.currentLoad > this.config.loadThreshold) {
          await this.triggerLoadRedistribution();
        }
      } catch (error) {
        this.logger.error('Load monitoring failed', { error });
      }
    }, this.config.redistributionDelay);
  }

  /**
   * Trigger load redistribution when threshold is exceeded
   */
  private async triggerLoadRedistribution(): Promise<void> {
    const instances = await this.getActiveInstances();
    const overloadedInstances = instances.filter((i) => i.load > this.config.loadThreshold);

    if (overloadedInstances.length > 0) {
      this.logger.warn('Load redistribution triggered', {
        overloadedCount: overloadedInstances.length,
        currentLoad: this.currentLoad,
      });

      // Publish redistribution event for cluster coordination
      await this.redisService.publish(
        `${this.config.clusterKey}:events`,
        JSON.stringify({
          type: 'load_redistribution',
          timestamp: new Date(),
          overloadedInstances: overloadedInstances.map((i) => i.instanceId),
          triggeredBy: this.config.instanceId,
        })
      );
    }
  }

  /**
   * Gracefully shutdown this instance
   */
  async shutdown(): Promise<void> {
    try {
      // Clear timers
      if (this.heartbeatTimer) {
        clearInterval(this.heartbeatTimer);
      }
      if (this.redistributionTimer) {
        clearInterval(this.redistributionTimer);
      }

      // Mark instance as draining
      const key = `${this.config.clusterKey}:instances:${this.config.instanceId}`;
      const data = await this.redisService.get(key);

      if (data) {
        const instance = JSON.parse(data);
        instance.status = 'inactive';
        await this.redisService.setex(key, 30, JSON.stringify(instance));
      }

      // Remove from active set
      await this.redisService.srem(`${this.config.clusterKey}:active`, this.config.instanceId);

      this.logger.info('Scaling coordinator shutdown complete');
    } catch (error) {
      this.logger.error('Error during shutdown', { error });
    }
  }
}
