import * as crypto from 'crypto';
import * as vscode from 'vscode';

const IV_LENGTH = 12; // For AES-GCM IV, must match Chrome's SecurityManager
const ALGORITHM = 'aes-256-gcm';

export class VSCodeSecurityManager {
    private sharedSecret: string | null = null;
    private derivedKey: Buffer | null = null;

    constructor() {
        this.loadSharedSecret();
        vscode.workspace.onDidChangeConfiguration(e => {
            if (e.affectsConfiguration('thefuse.sharedSecret')) {
                this.loadSharedSecret();
            }
        });
    }

    private loadSharedSecret(): void {
        const config = vscode.workspace.getConfiguration('thefuse');
        this.sharedSecret = config.get<string>('sharedSecret') || null;
        this.deriveKeyFromSecret();
    }

    private deriveKeyFromSecret(): void {
        if (!this.sharedSecret) {
            this.derivedKey = null;
            console.warn('[VSCodeSecurityManager] Shared secret is not set.');
            return;
        }
        try {
            this.derivedKey = crypto.createHash('sha256')
                                  .update(this.sharedSecret)
                                  .digest();
            console.log('[VSCodeSecurityManager] Encryption key derived successfully.');
        } catch (error) {
            console.error('[VSCodeSecurityManager] Error deriving encryption key:', error);
            this.derivedKey = null;
        }
    }

    public encryptMessage(message: string): string | null {
        const encryptionEnabled = true;
        if (!encryptionEnabled || !this.derivedKey) {
            return message;
        }

        try {
            const iv = crypto.randomBytes(IV_LENGTH);
            const cipher = crypto.createCipheriv(ALGORITHM, this.derivedKey, iv);

            let encrypted = cipher.update(message, 'utf8', 'hex');
            encrypted += cipher.final('hex');
            const authTag = cipher.getAuthTag();

            return JSON.stringify({
                iv: iv.toString('hex'),
                data: encrypted,
                tag: authTag.toString('hex')
            });
        } catch (error) {
            console.error('[VSCodeSecurityManager] Encryption failed:', error);
            return null;
        }
    }

    public decryptMessage(encryptedPayload: string): string | null {
        const encryptionEnabled = true;
        if (!encryptionEnabled) {
            try { JSON.parse(encryptedPayload); } catch (e) { return encryptedPayload; }
            return encryptedPayload;
        }

        if (!this.derivedKey) {
            console.warn('[VSCodeSecurityManager] Decryption key is not available.');
            try { JSON.parse(encryptedPayload); } catch (e) { return encryptedPayload; }
            return null;
        }

        try {
            const { iv: ivHex, data: encryptedHex, tag: tagHex } = JSON.parse(encryptedPayload);
            
            if (!ivHex || !encryptedHex || !tagHex) {
                console.warn('[VSCodeSecurityManager] Invalid encrypted payload format.');
                return encryptedPayload;
            }

            const iv = Buffer.from(ivHex, 'hex');
            const decipher = crypto.createDecipheriv(ALGORITHM, this.derivedKey, iv);
            decipher.setAuthTag(Buffer.from(tagHex, 'hex'));

            let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
            decrypted += decipher.final('utf8');

            return decrypted;
        } catch (error) {
            console.warn('[VSCodeSecurityManager] Decryption failed:', error);
            return null;
        }
    }
}
