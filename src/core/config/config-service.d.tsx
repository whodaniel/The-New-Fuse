export declare class ConfigService {
  private config;
  constructor();
  get<T>(key: string, defaultValue?: T): T;
  set(key: string, value: unknown): void;
  has(key: string): boolean;
  getAll(): Record<string, any>;
}
export default ConfigService;
