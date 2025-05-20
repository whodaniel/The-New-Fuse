import { JsonValue, UnknownRecord, DataMap, Primitive, BaseEntity, ISODateTime, UUID, BaseConfig, BaseResponse } from './core/base-types.js';

// Export types using 'export type' syntax for TypeScript isolatedModules
export type {
  UnknownRecord,
  JsonValue,
  Primitive,
  BaseEntity,
  ISODateTime,
  UUID,
  BaseConfig,
  BaseResponse,
  DataMap
};

// Define and export additional types
export type ApiResponse<T> = {
  data: T;
  error?: string;
  meta?: Record<string, JsonValue>;
};

export type Handler<T = unknown, R = void> = (data: T) => Promise<R> | R;

export type ValidationResult<T> = {
  isValid: boolean;
  value?: T;
  errors?: string[];
};
