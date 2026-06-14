import * as bcrypt from 'bcrypt';
export class HashingService {
    constructor() {
        this.saltRounds = 10;
    }
    async hash(password) {
        return bcrypt.hash(password, this.saltRounds);
    }
    async compare(password, hash) {
        return bcrypt.compare(password, hash);
    }
}
//# sourceMappingURL=hashing.service.js.map