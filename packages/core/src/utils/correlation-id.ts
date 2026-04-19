import { AsyncLocalStorage } from 'async_hooks';
import { v4 as uuidv4 }
from 'uuid';

export class CorrelationIdService {
  private static asyncLocalStorage = new AsyncLocalStorage<string>();

  static generateCorrelationId(): string {
    return uuidv4();
  }

  static getCorrelationId(): string | undefined {
    return this.asyncLocalStorage.getStore();
  }

  static runWithId<T>(correlationId: string, fn: () => T): T {
    return this.asyncLocalStorage.run(correlationId, fn);
  }

  static middleware(req: any, res: any, next: any) {
    const correlationId = req.headers['x-correlation-id'] || CorrelationIdService.generateCorrelationId();
    res.setHeader('x-correlation-id', correlationId);
    CorrelationIdService.runWithId(correlationId, () => next());
  }
}