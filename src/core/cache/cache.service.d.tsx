export declare class CacheService {
  private readonly maxSize;
  private cache;
  constructor(maxSize?: number);
  get<T>(key: string): Promise<T | null>;
  set(key: string, value: unknown): Promise<void>;
  delete(key: string): Promise<void>;
}
