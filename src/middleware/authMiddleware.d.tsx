import { Request, Response, NextFunction } from "express";
import { User } from '../types/User.js';
export interface AuthenticatedRequest extends Request {
  user?: User;
}
export declare const authMiddleware: (
  req: Request,
  res: Response,
  next: NextFunction,
) => Promise<any>;
