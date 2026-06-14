var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Injectable } from '@nestjs/common';
import { EncryptionError } from './errors/EncryptionError.js';
import { decrypt, encrypt } from './utils/cryptoUtils.js';
let EncryptionService = class EncryptionService {
    // Algorithm, keyLength, ivLength are now managed by cryptoUtils
    constructor() {
        // Logger functionality removed for now
    }
    async encrypt(data, key) {
        try {
            return encrypt(data, key);
        }
        catch {
            throw new EncryptionError('Failed to encrypt data');
        }
    }
    async decrypt(encryptedText, key) {
        try {
            return decrypt(encryptedText, key);
        }
        catch {
            throw new EncryptionError('Failed to decrypt data');
        }
    }
};
EncryptionService = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [])
], EncryptionService);
export { EncryptionService };
//# sourceMappingURL=EncryptionService.js.map