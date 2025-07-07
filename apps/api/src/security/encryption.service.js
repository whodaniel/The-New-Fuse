"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EncryptionService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const cryptoUtils_1 = require("../../src/utils/cryptoUtils");
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
        return (0, cryptoUtils_1.encrypt)(text, this.key);
    }
    async decrypt(encryptedText) {
        // Use centralized cryptoUtils for decryption
        return (0, cryptoUtils_1.decrypt)(encryptedText, this.key);
    }
};
exports.EncryptionService = EncryptionService;
exports.EncryptionService = EncryptionService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], EncryptionService);
