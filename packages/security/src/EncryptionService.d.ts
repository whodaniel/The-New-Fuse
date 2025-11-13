export declare class EncryptionService {
    constructor();
    encrypt(data: string, key: Buffer): Promise<string>;
    decrypt(encryptedText: string, key: Buffer): Promise<string>;
}
//# sourceMappingURL=EncryptionService.d.ts.map