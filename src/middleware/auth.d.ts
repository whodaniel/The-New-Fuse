import { Request, Response, NextFunction } from "express";
interface UserPayload {
  id: string;
  [key: string]: unknown;
}
declare global {
  namespace Express {
    interface Request {
      user?: UserPayload;
    }
  }
}
declare const auth: (req: Request, res: Response, next: NextFunction) => void;
export default auth;
