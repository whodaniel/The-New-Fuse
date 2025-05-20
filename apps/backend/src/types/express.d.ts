import { User } from '@the-new-fuse/types';

declare namespace Express {
  interface Request {
    user?: User;
  }
}
