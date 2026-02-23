import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { drizzleUserRepository } from '@the-new-fuse/database';
import * as admin from 'firebase-admin';
import { Address, Hex, verifyMessage } from 'viem';
import { EventBus } from '../events/event-bus.service';
import { IdentityService } from '../services/identity.service';
import { LoggingService } from '../services/logging.service';
import { comparePasswords, hashPassword } from '../utils/auth.utils';
import { UserLoginEvent } from './events/auth.events';
import { TokenBlacklistService } from './token-blacklist.service';

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private logger: LoggingService,
    private eventBus: EventBus,
    private identityService: IdentityService,
    private configService: ConfigService,
    private tokenBlacklist: TokenBlacklistService
  ) {
    this.initializeFirebase();
  }

  private initializeFirebase() {
    if (admin.apps.length === 0) {
      const projectId = this.configService.get<string>('FIREBASE_PROJECT_ID');
      const clientEmail = this.configService.get<string>('FIREBASE_CLIENT_EMAIL');
      const privateKey = this.configService
        .get<string>('FIREBASE_PRIVATE_KEY')
        ?.replace(/\\n/g, '\n');

      if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
        try {
          admin.initializeApp();
          this.logger.log('Firebase Admin SDK initialized with GOOGLE_APPLICATION_CREDENTIALS');
          return;
        } catch (error) {
          this.logger.error('Failed to initialize Firebase Admin with env credentials', error);
        }
      }

      if (projectId && clientEmail && privateKey) {
        try {
          admin.initializeApp({
            credential: admin.credential.cert({
              projectId,
              clientEmail,
              privateKey,
            }),
          });
          this.logger.log('Firebase Admin SDK initialized successfully with explicit credentials');
        } catch (error) {
          this.logger.error('Failed to initialize Firebase Admin with explicit credentials', error);
        }
      } else if (projectId) {
        try {
          admin.initializeApp({
            credential: admin.credential.applicationDefault(),
            projectId,
          });
          this.logger.log(`Firebase Admin initialized for project (best effort): ${projectId}`);
        } catch (error) {
          this.logger.error('Failed to initialize Firebase Admin (best effort)', error);
        }
      } else {
        this.logger.warn('Firebase Admin SDK not initialized: Missing credentials');
      }
    }
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
    } as Parameters<typeof drizzleUserRepository.create>[0]);

    // TODO: Send verification email via EmailService
    // await this.emailService.sendVerificationEmail(email, verificationToken);

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
    // Find user by verification token
    const user = await drizzleUserRepository.findByVerificationToken(token);

    if (!user) {
      throw new UnauthorizedException('Invalid verification token');
    }

    if (user.verificationExpires && user.verificationExpires < new Date()) {
      throw new UnauthorizedException('Verification token has expired');
    }

    // Update user as verified
    const updatedUser = await drizzleUserRepository.update(user.id, {
      emailVerified: true,
      verificationToken: null,
      verificationExpires: null,
      isActive: true,
    } as Parameters<typeof drizzleUserRepository.update>[1]);

    if (!updatedUser) {
      throw new UnauthorizedException('Failed to verify email');
    }

    this.logger.log(`Email verified for user: ${user.email}`);

    // Generate JWT token for auto-login
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

  async resendVerification(email: string) {
    const user = await drizzleUserRepository.findByEmail(email);

    if (!user) {
      // Don't reveal whether user exists
      return { message: 'If an account exists, a verification email has been sent.' };
    }

    if (user.emailVerified) {
      return { message: 'Email is already verified.' };
    }

    // Generate new verification token
    const verificationToken = this.generateVerificationToken();
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await drizzleUserRepository.update(user.id, {
      verificationToken,
      verificationExpires,
    } as Parameters<typeof drizzleUserRepository.update>[1]);

    // TODO: Send verification email via EmailService
    // await this.emailService.sendVerificationEmail(email, verificationToken);

    this.logger.log(`Resent verification email to: ${email}`);

    return { message: 'If an account exists, a verification email has been sent.' };
  }

  async validateFirebaseToken(token: string) {
    try {
      if (admin.apps.length === 0) {
        throw new UnauthorizedException('Firebase Admin SDK not initialized');
      }
      const decodedToken = await admin.auth().verifyIdToken(token);
      const { email, uid, name, picture, email_verified } = decodedToken;

      if (!email) {
        throw new UnauthorizedException('Firebase token missing email');
      }

      // Find or create user
      let user = await drizzleUserRepository.findByEmail(email);
      if (!user) {
        user = await drizzleUserRepository.create({
          email,
          name: name || email.split('@')[0],
          hashedPassword: '', // No password for Firebase users
          isActive: true,
          emailVerified: email_verified || false,
        } as Parameters<typeof drizzleUserRepository.create>[0]);
        this.logger.log(`Created new user from Firebase: ${email}`);
      }

      await this.eventBus.publish(new UserLoginEvent(user));

      return {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        roles: Array.isArray(user.roles) ? user.roles : [user.role],
        isActive: user.isActive,
        uid,
      };
    } catch (error) {
      this.logger.error('Error validating Firebase token', error);
      throw new UnauthorizedException('Invalid Firebase token');
    }
  }

  async authenticate(firebaseToken: string) {
    const user = await this.validateFirebaseToken(firebaseToken);
    return this.login(user);
  }

  async logout(token: string) {
    // Blacklist the token
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

      const tokenEmail =
        typeof decoded.email === 'string' ? decoded.email.toLowerCase() : undefined;
      const tokenUserId =
        typeof decoded.sub === 'string'
          ? decoded.sub
          : typeof decoded.user_id === 'string'
            ? decoded.user_id
            : typeof decoded.uid === 'string'
              ? decoded.uid
              : undefined;

      let user =
        tokenEmail && tokenEmail.length > 0
          ? await drizzleUserRepository.findByEmail(tokenEmail)
          : null;
      if (!user && tokenUserId) {
        user = await drizzleUserRepository.findById(tokenUserId);
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
      // 2. Fallback: Try Firebase Token Verification
      // This will verify the signature AND find/create the user in DB
      try {
        return await this.validateFirebaseToken(token);
      } catch (firebaseError) {
        // 3. Both failed. Throw Unauthorized.
        throw new UnauthorizedException('Invalid token');
      }
    }
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

    const normalizedWallet = walletAddress.trim().toLowerCase();
    const normalizedDomain = domain.trim().toLowerCase();
    const derivedEmail = `${normalizedDomain}@unstoppabledomains.com`;

    // Try wallet-linked account first
    let user = await drizzleUserRepository.findByWalletAddress(normalizedWallet);

    if (!user) {
      // Try deterministic UD email to avoid duplicate records by provider.
      user = await drizzleUserRepository.findByEmail(derivedEmail);

      if (user) {
        // Existing account found for the UD identity; link wallet if not already linked.
        if (user.walletAddress && user.walletAddress.toLowerCase() !== normalizedWallet) {
          throw new ConflictException(
            'This Unstoppable Domain is already linked to a different wallet address'
          );
        }

        user = await drizzleUserRepository.update(user.id, {
          walletAddress: normalizedWallet,
          name: normalizedDomain,
          emailVerified: true,
        } as Parameters<typeof drizzleUserRepository.update>[1]);

        if (!user) {
          throw new UnauthorizedException('Failed to update linked Unstoppable Domains account');
        }

        this.logger.log(`Linked existing UD account ${derivedEmail} to wallet ${normalizedWallet}`);
      } else {
        // 1. Mint Machine ID (e.g. usr_xyz.thenewfuse.com)
        const machineId = await this.identityService.mintMachineID(normalizedWallet);

        // 2. Create new user with Unstoppable Domain + Machine ID
        user = await drizzleUserRepository.create({
          email: derivedEmail,
          name: normalizedDomain,
          hashedPassword: '', // No password for UD users
          walletAddress: normalizedWallet,
          emailVerified: true,
          isActive: true,
          // walletType, // TODO: Add to schema if needed
          // authProvider: 'unstoppable-domains', // TODO: Add to schema if needed
          // machineId: machineId // TODO: Add to schema
        } as Parameters<typeof drizzleUserRepository.create>[0]);

        this.logger.log(
          `Created new user for Unstoppable Domain: ${normalizedDomain} with Machine ID: ${machineId}`
        );
      }
    } else {
      // Wallet-linked account exists; keep name in sync with latest domain.
      if (user.name !== normalizedDomain) {
        user = await drizzleUserRepository.update(user.id, {
          name: normalizedDomain,
        } as Parameters<typeof drizzleUserRepository.update>[1]);
      }
      this.logger.log(`Found existing user for wallet: ${normalizedWallet}`);
    }

    // Publish login event
    await this.eventBus.publish(new UserLoginEvent(user));

    return user;
  }
}
