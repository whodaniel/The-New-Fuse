import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { verifyMessage, Address, Hex } from 'viem';
import { drizzleUserRepository } from '@the-new-fuse/database';
import { EventBus } from '../events/event-bus.service';
import { IdentityService } from '../services/identity.service';
import { LoggingService } from '../services/logging.service';
import { comparePasswords, hashPassword } from '../utils/auth.utils';
import { UserLoginEvent } from './events/auth.events';

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private logger: LoggingService,
    private eventBus: EventBus,
    private identityService: IdentityService
  ) {}

  async validateUser(email: string, password: string) {
    const user = await drizzleUserRepository.findByEmail(email);
    if (user && (await comparePasswords(password, user.hashedPassword))) {
      await this.eventBus.publish(new UserLoginEvent(user));
      return user;
    }
    return null;
  }

  async login(user: any) {
    const payload = { email: user.email, sub: user.id };
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    };
  }

  async register(email: string, password: string, name: string) {
    // Check if user already exists
    const existingUser = await drizzleUserRepository.findByEmail(email);
    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user
    const user = await drizzleUserRepository.create({
      email,
      hashedPassword,
      name,
    } as Parameters<typeof drizzleUserRepository.create>[0]);

    // Generate JWT token
    const payload = { email: user.email, sub: user.id };
    const access_token = this.jwtService.sign(payload);

    return {
      access_token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    };
  }

  async authenticate(firebaseToken: string) {
    // Firebase authentication logic - simplified for now
    // In production, verify the Firebase token
    return { message: 'Firebase authentication not implemented yet' };
  }

  async logout(token: string) {
    // Token invalidation logic
    return { message: 'Logged out successfully' };
  }

  async findOrCreateUnstoppableDomainsUser(
    domain: string,
    walletAddress: string,
    message: string,
    signature: string,
    walletType?: string
  ) {
    this.logger.log(`Authenticating Unstoppable Domain: ${domain}`);

    try {
      // Verify the signature matches the message and address
      // TODO: Parse message (EIP-4361) to verify nonce and expiration for replay protection
      const isValid = await verifyMessage({
        address: walletAddress as Address,
        message,
        signature: signature as Hex,
      });

      if (!isValid) {
        throw new UnauthorizedException('Invalid signature');
      }
    } catch (error) {
      this.logger.error(`Signature verification failed for ${walletAddress}`, error);
      throw new UnauthorizedException('Signature verification failed');
    }

    // Try to find user by wallet address first
    let user = await drizzleUserRepository.findByWalletAddress(walletAddress);

    if (!user) {
      // 1. Mint Machine ID (e.g. usr_xyz.thenewfuse.com)
      const machineId = await this.identityService.mintMachineID(walletAddress);

      // 2. Create new user with Unstoppable Domain + Machine ID
      user = await drizzleUserRepository.create({
        email: `${domain}@unstoppabledomains.com`, // Use domain as email
        name: domain,
        hashedPassword: '', // No password for UD users
        walletAddress,
        // walletType, // TODO: Add to schema if needed
        // authProvider: 'unstoppable-domains', // TODO: Add to schema if needed
        // machineId: machineId // TODO: Add to schema
      } as Parameters<typeof drizzleUserRepository.create>[0]);

      this.logger.log(
        `Created new user for Unstoppable Domain: ${domain} with Machine ID: ${machineId}`
      );
    } else {
      // Update existing user's domain if changed
      if (user.name !== domain) {
        user = await drizzleUserRepository.update(user.id, {
          name: domain,
        } as Parameters<typeof drizzleUserRepository.update>[1]);
      }
      this.logger.log(`Found existing user for wallet: ${walletAddress}`);
    }

    // Publish login event
    await this.eventBus.publish(new UserLoginEvent(user));

    return user;
  }
}
