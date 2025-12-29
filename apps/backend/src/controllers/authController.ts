import { drizzleUserRepository } from '@the-new-fuse/database';
import bcrypt from 'bcryptjs';
import { Request, Response } from 'express';
import jwt, { SignOptions } from 'jsonwebtoken';
import passport from 'passport';
import { AppConfigService } from '../config/app-config.service';
import { LoginDto, RegisterDto } from '../dto';

interface AuthenticatedRequest extends Request {
  user?: any;
}

/**
 * Authentication Controller
 *
 * Handles user authentication with secure configuration and input validation.
 * Uses AppConfigService for validated secrets and DTOs for input validation.
 */
export class SecureAuthController {
  constructor(private readonly appConfig: AppConfigService) {}

  /**
   * Google OAuth authentication
   */
  googleAuth = passport.authenticate('google', {
    scope: ['profile', 'email'],
  });

  /**
   * Google OAuth callback handler
   */
  googleAuthCallback = [
    passport.authenticate('google', { session: false }),
    async (req: AuthenticatedRequest, res: Response) => {
      try {
        const user = req.user;
        if (!user) {
          throw new Error('No user from Google');
        }

        // Use AppConfigService for secure JWT signing
        const token = jwt.sign({ id: user.id }, this.appConfig.jwtSecret, {
          expiresIn: this.appConfig.jwtExpiresIn,
        } as SignOptions);

        await drizzleUserRepository.createSession(
          user.id,
          token,
          new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
        );

        // Redirect to frontend with token
        res.redirect(`${this.appConfig.frontendUrl}/auth/callback?token=${token}`);
      } catch (error) {
        console.error('Google auth callback error:', error);
        res.redirect(`${this.appConfig.frontendUrl}/login?error=auth_failed`);
      }
    },
  ];

  /**
   * User registration with validated input
   */
  register = async (req: Request, res: Response) => {
    try {
      // Input validation handled by global ValidationPipe with RegisterDto
      const { email, password, name } = req.body as RegisterDto;

      // Check if user exists
      const existingUser = await drizzleUserRepository.findByEmail(email);

      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'User already exists',
        });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create user
      const user = await drizzleUserRepository.create({
        email,
        name: name || null,
        hashedPassword,
      });

      // Generate token using secure config
      const token = jwt.sign({ id: user.id }, this.appConfig.jwtSecret, {
        expiresIn: this.appConfig.jwtExpiresIn,
      } as SignOptions);

      // Create session
      await drizzleUserRepository.createSession(
        user.id,
        token,
        new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
      );

      res.status(201).json({
        success: true,
        data: {
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
          },
          token,
        },
      });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({
        success: false,
        message: 'Error registering user',
      });
    }
  };

  /**
   * User login with validated input
   */
  login = async (req: Request, res: Response) => {
    try {
      // Input validation handled by global ValidationPipe with LoginDto
      const { email, password } = req.body as LoginDto;

      // Find user
      const user = await drizzleUserRepository.findByEmail(email);

      if (!user || !user.hashedPassword) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials',
        });
      }

      // Check password
      const isValidPassword = await bcrypt.compare(password, user.hashedPassword);

      if (!isValidPassword) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials',
        });
      }

      // Generate token using secure config
      const token = jwt.sign({ id: user.id }, this.appConfig.jwtSecret, {
        expiresIn: this.appConfig.jwtExpiresIn,
      } as SignOptions);

      // Create session
      await drizzleUserRepository.createSession(
        user.id,
        token,
        new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
      );

      res.json({
        success: true,
        data: {
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
          },
          token,
        },
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({
        success: false,
        message: 'Error logging in',
      });
    }
  };

  /**
   * User logout
   */
  logout = async (req: Request, res: Response) => {
    try {
      const token = req.headers.authorization?.split(' ')[1];

      if (!token) {
        return res.status(401).json({
          success: false,
          message: 'No token provided',
        });
      }

      // Delete session
      await drizzleUserRepository.deleteSession(token);

      res.json({
        success: true,
        message: 'Logged out successfully',
      });
    } catch (error) {
      console.error('Logout error:', error);
      res.status(500).json({
        success: false,
        message: 'Error logging out',
      });
    }
  };

  /**
   * Get current user from token
   */
  getCurrentUser = async (req: Request, res: Response) => {
    try {
      const token = req.headers.authorization?.split(' ')[1];

      if (!token) {
        return res.status(401).json({
          success: false,
          message: 'No token provided',
        });
      }

      // Verify token using secure config
      const decoded = jwt.verify(token, this.appConfig.jwtSecret) as { userId: string };

      // Get user
      const user = await drizzleUserRepository.findById(decoded.userId);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found',
        });
      }

      res.json({
        success: true,
        data: {
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
          },
        },
      });
    } catch (error) {
      console.error('Get current user error:', error);
      res.status(500).json({
        success: false,
        message: 'Error getting current user',
      });
    }
  };
}

// REMOVED: All deprecated legacy exports (232 lines)
// Migration: Use SecureAuthController with AppConfigService dependency injection
// See apps/backend/src/config/app-config.service.ts for secure configuration
//
// Removed exports:
// - googleAuth, googleAuthCallback (used process.env.JWT_SECRET)
// - register, login, logout, getCurrentUser (bypassed AppConfigService)
// - authController object (composite of deprecated functions)
//
// Replacement: Import SecureAuthController and instantiate with AppConfigService
