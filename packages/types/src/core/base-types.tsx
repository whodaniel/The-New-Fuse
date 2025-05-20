// Basic JSON-compatible value types
export type JsonValue = 
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

// Generic record type
export type UnknownRecord = Record<string, unknown>;

// Data map type for structured data
export type DataMap = Record<string, JsonValue>;

// Primitive types
export type Primitive = string | number | boolean | null | undefined;

// Base entity interface
export interface BaseEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

// ISO DateTime string type
export type ISODateTime = string;

// UUID string type
export type UUID = string;

// Base configuration type
export interface BaseConfig {
  enabled: boolean;
  options?: Record<string, JsonValue>;
}

// Base API response type
export interface BaseResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  meta?: Record<string, JsonValue>;
}