export type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };
export type DataMap = Record<string, JsonValue>;
export type UnknownRecord = Record<string, unknown>;
export type Primitive = string | number | boolean | null | undefined;

export interface BaseEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

export type ISODateTime = string;
export type UUID = string;

export interface BaseConfig {
  [key: string]: unknown;
}

export interface BaseResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}
