import { AsyncLocalStorage } from 'async_hooks';
import { v4 as uuidv4 } from 'uuid';
export class CorrelationIdService {
    static { this.asyncLocalStorage = new AsyncLocalStorage(); }
    static generateCorrelationId() {
        return uuidv4();
    }
    static getCorrelationId() {
        return this.asyncLocalStorage.getStore();
    }
    static runWithId(correlationId, fn) {
        return this.asyncLocalStorage.run(correlationId, fn);
    }
    static middleware(req, res, next) {
        const correlationId = req.headers['x-correlation-id'] || CorrelationIdService.generateCorrelationId();
        res.setHeader('x-correlation-id', correlationId);
        CorrelationIdService.runWithId(correlationId, () => next());
    }
}
//# sourceMappingURL=correlation-id.js.map