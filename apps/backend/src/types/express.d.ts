// apps/backend/src/types/express.d.ts
import { User } from './auth'; // Import your custom User interface

declare global {
  namespace Express {
    interface User extends User {}
  }
}