/**
 * Security Manager Interface
 * Handles encryption, decryption, and security for A2A communications
 */

import { A2AMessage } from "../types/a2aMessages";

export interface SecurityConfig {
  encryptionKey: string;
  algorithm?: string;
  jwtSecret?: string;
  enableEncryption?: boolean;
}

export interface EncryptionResult {
  encryptedData: string;
  iv: string;
  tag?: string;
}

export interface SecurityManager {
  /**
   * Encrypt a message for secure transmission
   */
  encryptMessage(message: A2AMessage): Promise<A2AMessage>;

  /**
   * Decrypt a received message
   */
  decryptMessage(encryptedMessage: A2AMessage): Promise<A2AMessage>;

  /**
   * Generate a secure message ID
   */
  generateMessageId(): string;

  /**
   * Validate message integrity
   */
  validateMessage(message: A2AMessage): boolean;

  /**
   * Generate JWT token for authentication
   */
  generateToken(payload: any): string;

  /**
   * Verify JWT token
   */
  verifyToken(token: string): any;
}

/**
 * Basic Security Manager Implementation
 */
export class BasicSecurityManager implements SecurityManager {
  constructor(private config: SecurityConfig) {}

  async encryptMessage(message: A2AMessage): Promise<A2AMessage> {
    if (!this.config.enableEncryption) {
      return message;
    }

    try {
      // Simple implementation - in production, use proper encryption
      const encryptedPayload = Buffer.from(
        JSON.stringify(message.payload),
      ).toString("base64");

      return {
        ...message,
        payload: encryptedPayload,
        metadata: {
          ...message.metadata,
          encrypted: true,
        },
      };
    } catch (error) {
      throw new Error(`Encryption failed: ${error}`);
    }
  }

  async decryptMessage(encryptedMessage: A2AMessage): Promise<A2AMessage> {
    if (!encryptedMessage.metadata.encrypted) {
      return encryptedMessage;
    }

    try {
      // Simple implementation - in production, use proper decryption
      const decryptedPayload = JSON.parse(
        Buffer.from(encryptedMessage.payload as string, "base64").toString(),
      );

      return {
        ...encryptedMessage,
        payload: decryptedPayload,
        metadata: {
          ...encryptedMessage.metadata,
          encrypted: false,
        },
      };
    } catch (error) {
      throw new Error(`Decryption failed: ${error}`);
    }
  }

  generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  }

  validateMessage(message: A2AMessage): boolean {
    return !!(
      message.id &&
      message.timestamp &&
      message.source &&
      message.target &&
      message.type &&
      message.payload !== undefined
    );
  }

  generateToken(payload: any): string {
    if (!this.config.jwtSecret) {
      throw new Error("JWT secret not configured");
    }

    // Simple implementation - in production, use proper JWT library
    const header = Buffer.from(
      JSON.stringify({ alg: "HS256", typ: "JWT" }),
    ).toString("base64url");
    const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
    return `${header}.${body}.signature`;
  }

  verifyToken(token: string): any {
    if (!this.config.jwtSecret) {
      throw new Error("JWT secret not configured");
    }

    // Simple implementation - in production, use proper JWT verification
    const parts = token.split(".");
    if (parts.length !== 3) {
      throw new Error("Invalid token format");
    }

    return JSON.parse(Buffer.from(parts[1], "base64url").toString());
  }
}
