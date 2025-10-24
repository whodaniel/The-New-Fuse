import crypto from 'crypto';
import { AsyncLocalStorage } from 'async_hooks';
  static middleware(req: any, res: any, next: any) { const id = req.headers['x-correlation-id';
      res.setHeader('')