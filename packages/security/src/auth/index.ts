import * as bcrypt from 'bcrypt';
import { z } from 'zod';
import { UserRepository } from './types.js';

const UserCredentialsSchema = z.object({
  username: z.string(),
  password: z.string(),
  email: z.string().email().optional(),
});

export type UserCredentialsType = z.infer<typeof UserCredentialsSchema>;
export const UserCredentials = UserCredentialsSchema;

export class AuthService {
  private jwtSecret: string;
  private userRepository?: UserRepository;

  constructor(secret: string, userRepository?: UserRepository) {
    this.jwtSecret = secret;
    this.userRepository = userRepository;
  }

  /**
   * Validates user credentials against the configured user store.
   *
   * @throws {Error} If no user repository is configured
   * @param {UserCredentialsType} credentials - The credentials to validate
   * @returns {Promise<boolean>} Promise resolving to true if valid, false otherwise
   */
  async validateCredentials(credentials: UserCredentialsType): Promise<boolean> {
    // TODO: Inject UserRepository for production use
    // For now, throw to prevent silent security bypass
    if (!this.userRepository) {
      throw new Error(
        'AuthService.validateCredentials: No user repository configured. ' +
          'Inject a UserRepository implementation or use a different auth method.'
      );
    }

    const user = await this.userRepository.findByUsername(credentials.username);
    if (!user || !user.passwordHash) return false;

    // Use bcrypt or similar for password comparison
    return bcrypt.compare(credentials.password, user.passwordHash);
  }

  generateToken(payload: Record<string, unknown>, expiresIn: string = '1h'): string {
    // Note: Properly import and use jsonwebtoken
    const jwt = require('jsonwebtoken');
    return jwt.sign(payload, this.jwtSecret, { expiresIn });
  }

  verifyToken(token: string): Record<string, unknown> | null {
    try {
      const jwt = require('jsonwebtoken');
      return jwt.verify(token, this.jwtSecret) as Record<string, unknown>;
    } catch {
      return null;
    }
  }
}
