import express from 'express';
import type { Router, Request, Response, NextFunction } from 'express';

export function createRouter(): Router {
  return express.Router();
}

type RouterSetup = {
  mountMiddleware: (handler: express.RequestHandler) => express.RequestHandler;
  mountRouter: (path: string, router: Router) => void;
};

export function setupRoutes(app: express.Application): RouterSetup {
  // Helper function to safely mount middleware
  function mountMiddleware(handler: express.RequestHandler): express.RequestHandler {
    return (req: Request, res: Response, next: NextFunction) => {
      Promise.resolve(handler(req, res, next)).catch(next);
    };
  }

  // Helper function to safely mount a router
  function mountRouter(path: string, router: Router): void {
    app.use(path, (req: Request, res: Response, next: NextFunction) => {
      router(req, res, next);
    });
  }

  return {
    mountMiddleware,
    mountRouter
  };
}