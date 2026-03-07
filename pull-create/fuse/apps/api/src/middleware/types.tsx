import { Request, Response, NextFunction } from 'express';

export interface TypedRequest<T = any> extends Request {
  body: T;
}

export interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    email: string;
    roles: string[];
  };
}

export type MiddlewareFunction = (
  req: Request | TypedRequest | AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => Promise<void> | void;

export interface ErrorHandlingMiddleware {
  (err: Error, req: Request, res: Response, next: NextFunction): void;
}

export interface ValidationSchema {
  [key: string]: any;
}

export interface CacheConfig {
  ttl: number;
  key?: string | ((req: Request) => string);
}