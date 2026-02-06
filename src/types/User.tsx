import { User as DrizzleUser } from "@the-new-fuse/database";

export interface User extends DrizzleUser {
  id: string;
  email: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  role: string;
  settings?: Record<string, any>;
}

export interface AuthenticatedRequest extends Request {
  user?: User;
}
