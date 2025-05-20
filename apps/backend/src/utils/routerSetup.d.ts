import express from 'express';
import type { Router } from 'express';
export declare function createRouter(): any Router;
type RouterSetup = {
    mountMiddleware: (handler: express.RequestHandler) => express.RequestHandler;
    mountRouter: (path: string, router: Router) => void;
};
export declare function setupRoutes(app: express.Application): any RouterSetup;
export {};
