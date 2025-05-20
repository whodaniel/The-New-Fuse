import { injectable, inject } from "inversify";
import { Request, Response, NextFunction } from "express";
import TYPES from '../di/types.js';
import { AuthService } from './auth-service.js';
import { Logger } from "winston";
import { ErrorHandler } from '../error/error-handler.js';
import { User } from './auth.types.js';

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

  public authenticate = async(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const token: unknown) {
      this.logger.error("Authentication failed", {
        error: error.message,
        path: req.path,
      }): unknown) {
        throw this.errorHandler.createError(
          "No token provided",
          "AUTH_NO_TOKEN",
          401,
        ): string[]) => {
    return async (): Promise<void> {req: Request, res: Response, next: NextFunction) => {
      try {
        if(!req.user: unknown) {
          throw this.errorHandler.createError(
            "User not authenticated",
            "AUTH_NO_USER",
            401,
          ): unknown) {
        this.logger.error("Role check failed", {
          error: error.message,
          path: req.path,
          requiredRoles: roles,
          userRoles: req.user?.roles,
        }): unknown) {
          throw this.errorHandler.createError(
            "Insufficient roles",
            "AUTH_INSUFFICIENT_ROLES",
            403,
          ): string[]) => {
    return async (): Promise<void> {req: Request, res: Response, next: NextFunction) => {
      try {
        if(!req.user: unknown) {
          throw this.errorHandler.createError(
            "User not authenticated",
            "AUTH_NO_USER",
            401,
          ): unknown) {
        this.logger.error("Permission check failed", {
          error: error.message,
          path: req.path,
          requiredPermissions: permissions,
          userPermissions: req.user?.permissions,
        }): Request): string | null {
    const authHeader: unknown) {
          throw this.errorHandler.createError(
            "Insufficient permissions",
            "AUTH_INSUFFICIENT_PERMISSIONS",
            403,
          );
        }

        next();
      } catch (error req.headers.authorization;
    if (!authHeader) return null;

    const [type, token]  = permissions.some((permission) =>
          req.user!.permissions.includes(permission),
        );
        if(!hasPermission authHeader.split(" ");
    return type === "Bearer" && token ? token : null;
  }
}
