/**
 * Type declarations to override default passport types
 */
import { User } from "./user.types";

declare global {
  namespace Express {
    interface User {
      id: string;
      email: string;
      [key: string]: any;
    }
  }
}

declare module "passport" {
  interface User {
    id: string;
    email: string;
    [key: string]: any;
  }
}
