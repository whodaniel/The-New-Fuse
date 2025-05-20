// This file extends the Express session to include our custom properties
import 'express-session';

declare module 'express-session' {
  interface SessionData {
    user_id?: string;
  }
}