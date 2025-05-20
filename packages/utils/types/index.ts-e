// Common types for this directory

// Common interfaces
export interface Dictionary<T> {
  [key: string]: T;
}

export interface AsyncResponse<T> {
  data: T;
  error?: string;
  status: number;
}

// Common utility types
export type Nullable<T> = T | null;
export type Optional<T> = T | undefined;
export type Maybe<T> = T | null | undefined;
export type AsyncFunction<T = any> = (...args: unknown[]) => Promise<T>;
export type ErrorCallback = (error: Error) => void;
export type SuccessCallback<T = any> = (data: T) => void;
