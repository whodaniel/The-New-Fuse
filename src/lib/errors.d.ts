export declare class BaseError extends Error {
  statusCode: number;
  constructor(message: string, statusCode?: number);
}
export declare class AuthError extends BaseError {
  constructor(message?: string, statusCode?: number);
}
export declare class FileUploadError extends BaseError {
  constructor(message?: string, statusCode?: number);
}
