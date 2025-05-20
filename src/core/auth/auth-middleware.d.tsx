import { Request, Response, NextFunction } from "express";
import { AuthService } from './auth-service.js';
import { Logger } from "winston";
import { ErrorHandler } from '../error/error-handler.js';
declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}
export declare class AuthMiddleware {
  private authService;
  private logger;
  private errorHandler;
  constructor(
    authService: AuthService,
    logger: Logger,
    errorHandler: ErrorHandler,
  );
  authenticate: (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => Promise<void>;
  requireRoles: (
    roles: string[],
  ) => (req: Request, res: Response, next: NextFunction) => Promise<void>;
  requirePermissions: (
    permissions: string[],
  ) => (req: Request, res: Response, next: NextFunction) => Promise<void>;
  private extractToken;
}
