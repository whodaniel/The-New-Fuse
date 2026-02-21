// auth.ts

import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

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

const auth = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const token = req.header("Authorization");
    
    if (!token) {
      throw new Error("No token provided");
    }
    
    // Remove Bearer prefix if it exists
    const tokenString = token.replace('Bearer ', '');
    
    // Verify the token with your secret key
    const decoded = jwt.verify(tokenString, process.env.JWT_SECRET as string) as UserPayload;
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).send({ error: "Please authenticate." });
  }
};

export default auth;
