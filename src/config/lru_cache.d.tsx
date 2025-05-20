export declare class LRUCache<K, V> {
  private capacity;
  private cache;
  constructor(capacity: number);
  get(key: K): V | undefined;
  put(key: K, value: V): void;
  has(key: K): boolean;
  delete(key: K): boolean;
  clear(): void;
  size(): number;
}
