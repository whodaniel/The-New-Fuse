import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { drizzleUserRepository } from '@the-new-fuse/database';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Address, Hex, verifyMessage } from 'viem';
// @ts-ignore
import { SiweMessage } from 'siwe';
import { EventBus } from '../events/event-bus.service';
import { IdentityService } from '../services/identity.service';
import { LoggingService } from '../services/logging.service';
import { comparePasswords, hashPassword } from '../utils/auth.utils';
import { UserLoginEvent } from './events/auth.events';
import { TokenBlacklistService } from './token-blacklist.service';

@Injectable()
export class AuthService {
  private supabase: SupabaseClient;

  constructor(
    private jwtService: JwtService,
    private logger: LoggingService,
    private eventBus: EventBus,
    private identityService: IdentityService,
    private configService: ConfigService,
    private tokenBlacklist: TokenBlacklistService
  ) {
    this.supabase = createClient(
      this.configService.get<string>('SUPABASE_URL') || '',
      this.configService.get<string>('SUPABASE_SERVICE_ROLE_KEY') || this.configService.get<string>('SUPABASE_ANON_KEY') || ''
    );
  }

  async validateUser(email: string, password: string) {
    const user = await drizzleUserRepository.findByEmail(email);
    if (user && (await comparePasswords(password, user.hashedPassword))) {
      await this.eventBus.publish(new UserLoginEvent(user));
      return user;
    }
    return null;
  }

  async login(user: any) {
    const payload = { email: user.email, sub: user.id, role: user.role, roles: user.roles };
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        roles: user.roles,
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

    // Generate verification token
    const verificationToken = this.generateVerificationToken();
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Create user (unverified)
    const user = await drizzleUserRepository.create({
      email,
      hashedPassword,
      name,
      emailVerified: false,
      verificationToken,
      verificationExpires,
    } as any);

    this.logger.log(`User registered: ${email}, verification pending`);

    return {
      message: 'Registration successful. Please check your email to verify your account.',
      email,
      requiresVerification: true,
    };
  }

  private generateVerificationToken(): string {
    return require('crypto').randomBytes(32).toString('hex');
  }

  async verifyEmail(token: string) {
    const user = await drizzleUserRepository.findByVerificationToken(token);

    if (!user) {
      throw new UnauthorizedException('Invalid verification token');
    }

    if (user.verificationExpires && user.verificationExpires < new Date()) {
      throw new UnauthorizedException('Verification token has expired');
    }

    const updatedUser = await drizzleUserRepository.update(user.id, {
      emailVerified: true,
      verificationToken: null,
      verificationExpires: null,
      isActive: true,
    } as any);

    if (!updatedUser) {
      throw new UnauthorizedException('Failed to verify email');
    }

    this.logger.log(`Email verified for user: ${user.email}`);

    const payload = {
      email: updatedUser.email,
      sub: updatedUser.id,
      role: updatedUser.role,
      roles: updatedUser.roles,
    };
    const access_token = this.jwtService.sign(payload);

    return {
      message: 'Email verified successfully',
      access_token,
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        role: updatedUser.role,
        roles: updatedUser.roles,
      },
    };
  }

  async validateSupabaseToken(token: string) {
    try {
      const { data: { user: supabaseUser }, error } = await this.supabase.auth.getUser(token);
      
      if (error || !supabaseUser) {
        throw error || new Error('User not found');
      }

      const email = supabaseUser.email;
      if (!email) {
        throw new UnauthorizedException('Supabase token missing email');
      }

      // Find or create user in our DB
      let user = await drizzleUserRepository.findByEmail(email);
      if (!user) {
        user = await drizzleUserRepository.create({
          email,
          name: supabaseUser.user_metadata?.full_name || email.split('@')[0],
          hashedPassword: '', // No password for OAuth users
          isActive: true,
          emailVerified: true,
        } as any);
        this.logger.log(`Created new user from Supabase: ${email}`);
      }

      await this.eventBus.publish(new UserLoginEvent(user));

      return {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        roles: Array.isArray(user.roles) ? user.roles : [user.role],
        isActive: user.isActive,
        supabaseId: supabaseUser.id,
      };
    } catch (error) {
      this.logger.error('Error validating Supabase token', error);
      throw new UnauthorizedException('Invalid Supabase token');
    }
  }

  async authenticate(token: string) {
    const user = await this.validateSupabaseToken(token);
    return this.login(user);
  }

  async logout(token: string) {
    if (token) {
      const decoded = this.jwtService.decode(token) as any;
      if (decoded?.sub) {
        await this.tokenBlacklist.blacklistToken(token, decoded.sub, 'logout');
      }
    }
    return { message: 'Logged out successfully' };
  }

  async resolveCurrentUserFromAuthHeader(authHeader?: string) {
    if (!authHeader?.startsWith('Bearer ')) {
      throw new UnauthorizedException('No token provided');
    }

    const token = authHeader.split('Bearer ')[1];
    if (!token) {
      throw new UnauthorizedException('No token provided');
    }

    try {
      // 1. Try to verify as local JWT
      const decoded = this.jwtService.verify(token) as Record<string, any>;
      const tokenEmail = typeof decoded.email === 'string' ? decoded.email.toLowerCase() : undefined;
      
      let user = tokenEmail ? await drizzleUserRepository.findByEmail(tokenEmail) : null;
      if (!user && decoded.sub) {
        user = await drizzleUserRepository.findById(decoded.sub);
      }

      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      return {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        roles: Array.isArray(user.roles) ? user.roles : [user.role],
        isActive: user.isActive,
      };
    } catch (localJwtError) {
      // 2. Fallback: Try Supabase Token Verification
      try {
        return await this.validateSupabaseToken(token);
      } catch (supabaseError) {
        throw new UnauthorizedException('Invalid token');
      }
    }
  }

  async findOrCreateUnstoppableDomainsUser(
    domain: string,
    walletAddress: string,
    message: string,
    signature: string
  ) {
    try {
      const siweMessage = new SiweMessage(message);
      const verificationResult = await siweMessage.verify({ signature });

      if (!verificationResult.success || siweMessage.address.toLowerCase() !== walletAddress.toLowerCase()) {
        throw new UnauthorizedException('Invalid signature or address mismatch');
      }
    } catch (error) {
      throw new UnauthorizedException('Signature verification failed');
    }

    const normalizedWallet = walletAddress.trim().toLowerCase();
    const normalizedDomain = domain.trim().toLowerCase();
    const derivedEmail = `${normalizedDomain}@unstoppabledomains.com`;

    let user = await drizzleUserRepository.findByWalletAddress(normalizedWallet);

    if (!user) {
      user = await drizzleUserRepository.findByEmail(derivedEmail);

      if (user) {
        user = await drizzleUserRepository.update(user.id, {
          walletAddress: normalizedWallet,
          name: normalizedDomain,
          emailVerified: true,
        } as any);
      } else {
        const machineId = await this.identityService.mintMachineID(normalizedWallet);
        user = await drizzleUserRepository.create({
          email: derivedEmail,
          name: normalizedDomain,
          hashedPassword: '',
          walletAddress: normalizedWallet,
          emailVerified: true,
          isActive: true,
        } as any);
      }
    }

    await this.eventBus.publish(new UserLoginEvent(user));
    return user;
  }
}
