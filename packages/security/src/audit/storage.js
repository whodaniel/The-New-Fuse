"use strict";
// import { Logger } from '@the-new-fuse/utils';
Object.defineProperty(exports, "__esModule", { value: true });
exports.InMemoryAuditStorage = void 0;
// In-memory implementation for development/testing
class InMemoryAuditStorage {
    entries = [];
    // private readonly logger: Logger;
    constructor() {
        // this.logger = new Logger('InMemoryAuditStorage');
    }
    async store(entry) {
        this.entries.push(entry);
        // this.logger.debug('Stored audit entry', { entry });
        // console.debug('Stored audit entry', { entry });
    }
    async query(filter) {
        return this.entries.filter(entry => {
            return Object.entries(filter).every(([key, value]) => entry[key] === value);
        });
    }
}
exports.InMemoryAuditStorage = InMemoryAuditStorage;
//# sourceMappingURL=storage.js.map