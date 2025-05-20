export declare class BaseError extends Error {
  readonly code: string;
  readonly statusCode: number;
  readonly isOperational: boolean;
  constructor(
    message: string,
    code: string,
    statusCode?: number,
    isOperational?: boolean,
  );
}
