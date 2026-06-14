export declare class EncryptionService {
    private algorithm;
    private ivLength;
    private saltLength;
    private keyLength;
    constructor();
    encrypt(text: string, secret: string): Promise<string>;
    decrypt(encryptedText: string, secret: string): Promise<string>;
    hash(text: string): Promise<string>;
    compareHash(text: string, hash: string): Promise<boolean>;
}
//# sourceMappingURL=encryption.d.ts.map