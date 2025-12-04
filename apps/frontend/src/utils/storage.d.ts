export type StorageType = 'local' | 'session';
export interface StorageOptions {
    type?: StorageType;
    expires?: number;
}
export declare function getStorage(type?: StorageType): Storage;
export declare function setItem<T>(key: string, value: T, options?: StorageOptions): void;
export declare function getItem<T>(key: string, options?: StorageOptions): T | null;
export declare function removeItem(key: string, options?: StorageOptions): void;
export declare function clear(type?: StorageType): void;
export declare function clearExpired(type?: StorageType): void;
export declare function getSize(type?: StorageType): number;
export declare function hasSupport(type?: StorageType): boolean;
export declare function subscribe(key: string, callback: (value: any) => void, options?: StorageOptions): () => void;
