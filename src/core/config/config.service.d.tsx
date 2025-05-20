import { Logger } from "winston";
import { EventBus } from '../events/event-bus.js';
export interface ConfigOptions {
  configPath?: string;
  env?: string;
  watchConfig?: boolean;
}
export declare class ConfigService {
  private logger;
  private eventBus;
  private config;
  private watcher;
  constructor(logger: Logger, eventBus: EventBus);
  initialize(options?: ConfigOptions): Promise<void>;
  get<T>(key: string, defaultValue?: T): T;
  set(key: string, value: unknown): void;
  private watchConfig;
  dispose(): void;
}
//# sourceMappingURL=config.service.d.ts.map
