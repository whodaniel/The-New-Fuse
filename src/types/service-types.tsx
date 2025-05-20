export interface BaseServiceConfig {
  enabled?: boolean;
  debug?: boolean;
}

export interface ServiceResult<T> {
  success: boolean;
  data?: T;
  error?: Error;
}

export interface AsyncServiceResult<T> extends Promise<ServiceResult<T>> {}
