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
const cryptoUtils_1 = require("./utils/cryptoUtils");
const common_1 = require("@nestjs/common");
const EncryptionError_1 = require("./errors/EncryptionError");
let EncryptionService = class EncryptionService {
    // Algorithm, keyLength, ivLength are now managed by cryptoUtils
    constructor() {
        // Logger functionality removed for now
    }
    async encrypt(data, key) {
        try {
            return (0, cryptoUtils_1.encrypt)(data, key);
        }
        catch {
            throw new EncryptionError_1.EncryptionError('Failed to encrypt data');
        }
    }
    async decrypt(encryptedText, key) {
        try {
            return (0, cryptoUtils_1.decrypt)(encryptedText, key);
        }
        catch {
            throw new EncryptionError_1.EncryptionError('Failed to decrypt data');
        }
    }
};
exports.EncryptionService = EncryptionService;
exports.EncryptionService = EncryptionService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], EncryptionService);
//# sourceMappingURL=EncryptionService.js.map