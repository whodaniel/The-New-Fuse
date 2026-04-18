import { Injectable } from '@nestjs/common';
import { drizzleUserRepository } from '@the-new-fuse/database';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';
import { AppConfigService } from '../config/app-config.service.js';

// Constants
const SALT_ROUNDS = 10;

/**
 * Enhanced Authentication Utilities Service
 *
 * Provides password hashing, JWT token management, and user validation
 * using secure configuration from AppConfigService.
 *
 * Security features:
 * - Bcrypt password hashing with configurable salt rounds
 * - JWT token generation with validated secrets
 * - User validation with secure password comparison
 * - No hardcoded secrets or fallback defaults
 */
@Injectable()
export class EnhancedAuthUtilsService {
  constructor(private readonly appConfig: AppConfigService) {}

  /**
   * Hash a password using bcrypt
   *
   * @param password - Plain text password
   * @returns Hashed password
   */
  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, SALT_ROUNDS);
  }

  /**
   * Compare a password with a hash
   *
   * @param password - Plain text password
   * @param hashedPassword - Hashed password from database
   * @returns True if passwords match
   */
  async comparePasswords(password: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
  }

  /**
   * Generate a JWT token with validated secret
   *
   * @param payload - Token payload
   * @param expiresIn - Token expiration time
   * @returns Signed JWT token
   */
  generateToken(payload: any, expiresIn?: string): string {
    return jwt.sign(payload, this.appConfig.jwtSecret, {
      expiresIn: expiresIn || this.appConfig.jwtExpiresIn,
      issuer: this.appConfig.jwtIssuer,
    } as jwt.SignOptions);
  }

  /**
   * Verify a JWT token
   *
   * @param token - JWT token to verify
   * @returns Decoded token payload
   * @throws Error if token is invalid
   */
  verifyToken(token: string): any {
    try {
      return jwt.verify(token, this.appConfig.jwtSecret, {
        issuer: this.appConfig.jwtIssuer,
      });
    } catch (error) {
      throw new Error('Invalid token');
    }
  }

  /**
   * Validate user credentials
   *
   * @param email - User email
   * @param password - Plain text password
   * @returns User object (without password) if valid, null otherwise
   */
  async validateUser(email: string, password: string): Promise<any> {
    const user = await drizzleUserRepository.findByEmail(email);

    if (!user) {
      return null;
    }

    const isPasswordValid = await this.comparePasswords(password, user.hashedPassword || '');

    if (!isPasswordValid) {
      return null;
    }

    // Don't return the password
    const { hashedPassword: _password, ...result } = user;
    return result;
  }
}

// Legacy function exports for backwards compatibility
// These should be avoided in new code - use EnhancedAuthUtilsService instead

/**
 * @deprecated Use EnhancedAuthUtilsService.hashPassword() instead
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * @deprecated Use EnhancedAuthUtilsService.comparePasswords() instead
 */
export async function comparePasswords(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

/**
 * @deprecated Use EnhancedAuthUtilsService.generateToken() instead
 */
export function generateToken(payload: any, expiresIn: string = '24h'): string {
  const JWT_SECRET = process.env.JWT_SECRET;
  if (!JWT_SECRET) {
    throw new Error('JWT_SECRET not configured');
  }
  return jwt.sign(payload, JWT_SECRET, { expiresIn } as jwt.SignOptions);
}

/**
 * @deprecated Use EnhancedAuthUtilsService.verifyToken() instead
 */
export function verifyToken(token: string): any {
  const JWT_SECRET = process.env.JWT_SECRET;
  if (!JWT_SECRET) {
    throw new Error('JWT_SECRET not configured');
  }

  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    throw new Error('Invalid token');
  }
}

/**
 * @deprecated Use EnhancedAuthUtilsService.validateUser() instead
 */
export async function validateUser(email: string, password: string): Promise<any> {
  const user = await drizzleUserRepository.findByEmail(email);

  if (!user) {
    return null;
  }

  const isPasswordValid = await comparePasswords(password, user.hashedPassword || '');

  if (!isPasswordValid) {
    return null;
  }

  // Don't return the password
  const { hashedPassword: _password, ...result } = user;
  return result;
}
