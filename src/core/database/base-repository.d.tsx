import { Logger } from "@the-new-fuse/utils";
import { BaseEntity } from "@the-new-fuse/types";
import { DatabaseService, Repository, QueryOptions } from './types.js';
import { ErrorHandler } from '../error/error-handler.js';
import { EventBus } from '../events/event-bus.js';
import { MetricsCollector } from '../metrics/metrics-collector.js';
export declare abstract class BaseRepository<T extends BaseEntity>
  implements Repository<T>
{
  protected readonly logger: Logger;
  protected readonly db: DatabaseService;
  protected readonly errorHandler: ErrorHandler;
  protected readonly eventBus: EventBus;
  protected readonly metrics: MetricsCollector;
  protected abstract readonly entityName: string;
  constructor(
    logger: Logger,
    db: DatabaseService,
    errorHandler: ErrorHandler,
    eventBus: EventBus,
    metrics: MetricsCollector,
  );
  find(options?: QueryOptions): Promise<T[]>;
  findOne(id: string, options?: QueryOptions): Promise<T | null>;
  create(data: Partial<T>): Promise<T>;
  update(id: string, data: Partial<T>): Promise<T>;
  delete(id: string): Promise<void>;
  protected handleError(error: unknown, operation: string): never;
}
