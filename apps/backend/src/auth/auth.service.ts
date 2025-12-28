import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { LoggingService } from '../services/logging.service';
import { comparePasswords } from '../utils/auth.utils';
import { EventBus } from '../events/event-bus.service';
import { UserLoginEvent } from './events/auth.events';
import { IdentityService } from '../services/identity.service';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private logger: LoggingService,
    private eventBus: EventBus,
    private identityService: IdentityService
  ) {}

  async validateUser(email: string, password: string) {
    const user = await this.usersService.findByEmail(email);
    if (user && await comparePasswords(password, user.password)) {
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
        name: user.name
      }
    };
  }

  async register(email: string, password: string, name: string) {
    // Check if user already exists
    const existingUser = await this.usersService.findByEmail(email);
    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Create user (password will be hashed in UsersService)
    const user = await this.usersService.create({
      email,
      password,
      name,
    });

    // Generate JWT token
    const payload = { email: user.email, sub: user.id };
    const access_token = this.jwtService.sign(payload);

    return {
      access_token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name
      }
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
    walletType?: string,
  ) {
    this.logger.log(`Authenticating Unstoppable Domain: ${domain}`);

    // Try to find user by wallet address first
    let user = await this.usersService.findByWalletAddress(walletAddress);

    if (!user) {
      // 1. Mint Machine ID (e.g. usr_xyz.thenewfuse.com)
      const machineId = await this.identityService.mintMachineID(walletAddress);
      
      // 2. Create new user with Unstoppable Domain + Machine ID
      // We store the Machine ID as a property if the schema supports it, 
      // or we can just log it for now as the "Internal ID".
      // Assuming 'name' is the display name (UD domain).
      user = await this.usersService.create({
        email: `${domain}@unstoppabledomains.com`, // Use domain as email
        name: domain, 
        password: null, // No password for UD users
        walletAddress,
        walletType,
        authProvider: 'unstoppable-domains',
        // machineId: machineId // TODO: Add to schema
      });

      this.logger.log(`Created new user for Unstoppable Domain: ${domain} with Machine ID: ${machineId}`);
    } else {
      // Update existing user's domain if changed
      if (user.name !== domain) {
        user = await this.usersService.update(user.id, {
          name: domain,
        });
      }
      this.logger.log(`Found existing user for wallet: ${walletAddress}`);
    }

    // Publish login event
    await this.eventBus.publish(new UserLoginEvent(user));

    return user;
  }
}
