import { Request, Response, NextFunction } from 'express';
/**
 * Authentication middleware
 * Verifies that the user is authenticated before proceeding
 */
export declare function authenticate(req: Request, res: Response, next: NextFunction): void;
