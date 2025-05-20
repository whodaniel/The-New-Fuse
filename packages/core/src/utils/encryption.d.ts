export declare class MessageEncryption {
    private readonly key;
    constructor(encryptionKey: string);
    /**
     * Encrypts a message using AES encryption
     */
    encrypt(message: string): string;
}
