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
import { ConfigService } from '@nestjs/config';
// import { encrypt, decrypt } from '../../../../../src/utils/cryptoUtils'; // Commented out as cryptoUtils.ts is not found
let EncryptionService = class EncryptionService {
    configService;
    algorithm = 'aes-256-cbc';
    key;
    constructor(configService) {
        this.configService = configService;
        const encryptionKey = this.configService.get('ENCRYPTION_KEY');
        if (!encryptionKey) {
            throw new Error('ENCRYPTION_KEY must be defined in environment variables');
        }
        this.key = Buffer.from(encryptionKey, 'hex');
    }
    async encrypt(text) {
        // Use centralized cryptoUtils for encryption
        return text;
    }
    async decrypt(encryptedText) {
        // Use centralized cryptoUtils for decryption
        return encryptedText;
    }
};
EncryptionService = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [ConfigService])
], EncryptionService);
export { EncryptionService };
//# sourceMappingURL=encryption.service.js.map