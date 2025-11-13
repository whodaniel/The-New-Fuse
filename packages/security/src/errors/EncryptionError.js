"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EncryptionError = void 0;
class EncryptionError extends Error {
    constructor(message) {
        super(message);
        this.name = 'EncryptionError';
    }
}
exports.EncryptionError = EncryptionError;
//# sourceMappingURL=EncryptionError.js.map