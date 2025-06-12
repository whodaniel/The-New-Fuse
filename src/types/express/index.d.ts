import { Request } from "express";
import { User } from '../auth.tsx';

declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}
export {};
