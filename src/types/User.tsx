import { User as PrismaUser } from "@the-new-fuse/database/client";

export interface User extends PrismaUser {
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
