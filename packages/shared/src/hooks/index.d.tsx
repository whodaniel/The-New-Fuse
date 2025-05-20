// Re-export hooks from the hooks package is commented out in the implementation
// to avoid circular dependencies
// export * from '@the-new-fuse/hooks';

export declare const useLocalStorage: <T>(key: string, initialValue: T) => [T, (value: T) => void];
