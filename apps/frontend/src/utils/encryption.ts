export {}
exports.verifyMessageSignature = exports.createMessageSignature = exports.E2EEncryption = exports.MessageEncryption = void 0;
import crypto_js_1 from 'crypto-js';
class MessageEncryption {
    constructor(encryptionKey) {
        this.key = encryptionKey;
    }
    encrypt(message) {
        try {
            return crypto_js_1.default.AES.encrypt(message, this.key).toString();
        }
        catch (error) {
            console.error('Encryption error:', error);
            throw new Error('Failed to encrypt message');
        }
    }
    decrypt(encryptedMessage) {
        try {
            const bytes = crypto_js_1.default.AES.decrypt(encryptedMessage, this.key);
            return bytes.toString(crypto_js_1.default.enc.Utf8);
        }
        catch (error) {
            console.error('Decryption error:', error);
            throw new Error('Failed to decrypt message');
        }
    }
    static generateKey() {
        return crypto_js_1.default.lib.WordArray.random(32).toString();
    }
    static createRoomKey(roomId, userIds) {
        const sortedUserIds = [...userIds].sort().join('-');
        const baseString = `${roomId}-${sortedUserIds}`;
        return crypto_js_1.default.SHA256(baseString).toString();
    }
}
exports.MessageEncryption = MessageEncryption;
class E2EEncryption {
    constructor() {
        this.keyPair = null;
    }
    async initialize() {
        try {
            this.keyPair = await window.crypto.subtle.generateKey({
                name: 'RSA-OAEP',
                modulusLength: 2048,
                publicExponent: new Uint8Array([1, 0, 1]),
                hash: 'SHA-256',
            }, true, ['encrypt', 'decrypt']);
        }
        catch (error) {
            console.error('E2E initialization error:', error);
            throw new Error('Failed to initialize E2E encryption');
        }
    }
    async exportPublicKey() {
        var _a;
        if (!((_a = this.keyPair) === null || _a === void 0 ? void 0 : _a.publicKey)) {
            throw new Error('E2E encryption not initialized');
        }
        try {
            const exported = await window.crypto.subtle.exportKey('spki', this.keyPair.publicKey);
            return window.btoa(String.fromCharCode(...new Uint8Array(exported)));
        }
        catch (error) {
            console.error('Public key export error:', error);
            throw new Error('Failed to export public key');
        }
    }
    async encryptForRecipient(data, recipientPublicKey) {
        try {
            const publicKey = await window.crypto.subtle.importKey('spki', Uint8Array.from(atob(recipientPublicKey), c => c.charCodeAt(0)), {
                name: 'RSA-OAEP',
                hash: 'SHA-256',
            }, true, ['encrypt']);
            const encoded = new TextEncoder().encode(data);
            const encrypted = await window.crypto.subtle.encrypt({
                name: 'RSA-OAEP',
            }, publicKey, encoded);
            return window.btoa(String.fromCharCode(...new Uint8Array(encrypted)));
        }
        catch (error) {
            console.error('E2E encryption error:', error);
            throw new Error('Failed to encrypt data for recipient');
        }
    }
    async decrypt(encryptedData) {
        var _a;
        if (!((_a = this.keyPair) === null || _a === void 0 ? void 0 : _a.privateKey)) {
            throw new Error('E2E encryption not initialized');
        }
        try {
            const encrypted = Uint8Array.from(atob(encryptedData), c => c.charCodeAt(0));
            const decrypted = await window.crypto.subtle.decrypt({
                name: 'RSA-OAEP',
            }, this.keyPair.privateKey, encrypted);
            return new TextDecoder().decode(decrypted);
        }
        catch (error) {
            console.error('E2E decryption error:', error);
            throw new Error('Failed to decrypt data');
        }
    }
}
exports.E2EEncryption = E2EEncryption;
const createMessageSignature = (message, userId): any => {
    return crypto_js_1.default.HmacSHA256(message, userId).toString();
};
exports.createMessageSignature = createMessageSignature;
const verifyMessageSignature = (message, signature, userId): any => {
    const computedSignature = (0, exports.createMessageSignature)(message, userId);
    return computedSignature === signature;
};
exports.verifyMessageSignature = verifyMessageSignature;
export {};
//# sourceMappingURL=encryption.js.map