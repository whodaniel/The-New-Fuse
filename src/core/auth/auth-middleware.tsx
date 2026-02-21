import { injectable, inject } from "inversify";
import { Request, Response, NextFunction } from "express";
import TYPES from '../di/types.tsx';
import { AuthService } from './auth-service.js';
import { Logger } from "winston";
import { ErrorHandler } from '../error/error-handler.js';
import { User } from './auth.types.tsx';

declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}

@injectable()
export class AuthMiddleware {
  constructor(
    @inject(TYPES.AuthService) private authService: AuthService,
    @inject(TYPES.Logger) private logger: Logger,
    @inject(TYPES.ErrorHandler) private errorHandler: ErrorHandler,
  ) {}

  public authenticate = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const token = this.extractTokenFromHeader(req);
      if (!token) {
        throw this.errorHandler.createError(
          "No token provided",
          "AUTH_NO_TOKEN",
          401,
        );
      }

      const user = await this.authService.validateToken(token);
      req.user = user;
      next();
    } catch (error: any) {
      this.logger.error("Authentication failed", {
        error: error.message,
        path: req.path,
      });
      res.status(error.statusCode || 401).json({
        error: error.message,
        code: error.code || "AUTH_FAILED"
      });
    }
  };

  public requireRoles = (roles: string[]) => {
    return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        if (!req.user) {
          throw this.errorHandler.createError(
            "User not authenticated",
            "AUTH_NO_USER",
            401,
          );
        }

        const hasRole = roles.some((role) => req.user!.roles.includes(role));
        if (!hasRole) {
          throw this.errorHandler.createError(
            "Insufficient roles",
            "AUTH_INSUFFICIENT_ROLES",
            403,
          );
        }

        next();
      } catch (error: any) {
        this.logger.error("Role check failed", {
          error: error.message,
          path: req.path,
          requiredRoles: roles,
          userRoles: req.user?.roles,
        });
        res.status(error.statusCode || 403).json({
          error: error.message,
          code: error.code || "AUTH_ROLE_FAILED"
        });
      }
    };
  };

  public requirePermissions = (permissions: string[]) => {
    return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        if (!req.user) {
          throw this.errorHandler.createError(
            "User not authenticated",
            "AUTH_NO_USER",
            401,
          );
        }

        const hasPermission = permissions.some((permission) =>
          req.user!.permissions.includes(permission),
        );
        if (!hasPermission) {
          throw this.errorHandler.createError(
            "Insufficient permissions",
            "AUTH_INSUFFICIENT_PERMISSIONS",
            403,
          );
        }

        next();
      } catch (error: any) {
        this.logger.error("Permission check failed", {
          error: error.message,
          path: req.path,
          requiredPermissions: permissions,
          userPermissions: req.user?.permissions,
        });
        res.status(error.statusCode || 403).json({
          error: error.message,
          code: error.code || "AUTH_PERMISSION_FAILED"
        });
      }
    };
  };

  private extractTokenFromHeader(req: Request): string | null {
    const authHeader = req.headers.authorization;
    if (!authHeader) return null;

    const [type, token] = authHeader.split(" ");
    return type === "Bearer" && token ? token : null;
  }
}