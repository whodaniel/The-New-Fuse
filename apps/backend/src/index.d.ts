import express from 'express';
import './config/passport';
declare module 'express-session' {
    interface SessionData {
        passport: {
            user: string;
        };
    }
}
declare const app: express.Application;
export default app;
