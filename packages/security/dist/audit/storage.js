// import { Logger } from '@the-new-fuse/utils';
// In-memory implementation for development/testing
export class InMemoryAuditStorage {
    // private readonly logger: Logger;
    constructor() {
        this.entries = [];
        // this.logger = new Logger('InMemoryAuditStorage');
    }
    async store(entry) {
        this.entries.push(entry);
        // this.logger.debug('Stored audit entry', { entry });
        // console.debug('Stored audit entry', { entry });
    }
    async query(filter) {
        return this.entries.filter((entry) => {
            return Object.entries(filter).every(([key, value]) => entry[key] === value);
        });
    }
}
//# sourceMappingURL=storage.js.map