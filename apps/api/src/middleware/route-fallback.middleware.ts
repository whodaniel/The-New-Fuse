import { NextFunction, Request, Response } from 'express';

export function routeFallbackMiddleware(req: Request, res: Response, next: NextFunction) {
  const isGet = req.method === 'GET';
  const path = req.path || '';
  const isApi = path.startsWith('/api');
  const isApiDocs = path.startsWith('/api-docs');
  const acceptsHtml = String(req.headers.accept || '').includes('text/html');

  if (!isGet || isApi || isApiDocs || !acceptsHtml) {
    return next();
  }

  const frontendBase = process.env.FRONTEND_URL || 'https://thenewfuse.com';
  try {
    const target = new URL(req.originalUrl || '/', frontendBase).toString();
    return res.redirect(302, target);
  } catch {
    return res.redirect(302, frontendBase);
  }
}
