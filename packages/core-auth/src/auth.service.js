"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var AuthService_1;
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const database_1 = require("@the-new-fuse/database");
const bcrypt = __importStar(require("bcrypt"));
const utils_1 = require("@the-new-fuse/utils");
let AuthService = AuthService_1 = class AuthService {
    prisma;
    jwtService;
    logger = new common_1.Logger(AuthService_1.name);
    saltRounds = 12;
    constructor(prisma, jwtService) {
        this.prisma = prisma;
        this.jwtService = jwtService;
    }
    /**
     * Register a new user
     */
    async register(registerDto) {
        try {
            const { email, password, name } = registerDto;
            // Check if user already exists
            const existingUser = await this.prisma.user.findUnique({
                where: { email }
            });
            if (existingUser) {
                throw new common_1.ConflictException('User with this email already exists');
            }
            // Hash password
            const hashedPassword = await bcrypt.hash(password, this.saltRounds);
            // Create user
            const user = await this.prisma.user.create({
                data: {
                    email,
                    hashedPassword,
                    name,
                },
            });
            // Generate tokens
            const tokens = await this.generateTokens(user);
            this.logger.log(`User registered successfully: ${email});

      // In the register method
      return {
        access_token: tokens.accessToken,
        refresh_token: tokens.refreshToken,
        user: {
          id: user.id,
          email: user.email,
          name: user.name || undefined,
          emailVerified: user.emailVerified || null,
        },
      };
    } catch (error) {
      const err = toError(error);`, this.logger.error(`Registration failed for ${registerDto.email}`, $, { err, : .message }, err.stack));
            throw error;
        }
        finally {
        }
    }
    /**
     * Request a password reset email
     */
    async requestPasswordReset(email) {
        try {
            const user = await this.prisma.user.findUnique({ where: { email } });
            if (!user) {
                // Don't reveal if user exists or not`
                this.logger.log(`Password reset requested for non-existent user: ${email}`);
                return;
            }
            // Generate a password reset token
            const resetToken = (await import('crypto')).randomBytes(32).toString('hex');
            const resetTokenExpires = new Date(Date.now() + 3600000); // 1 hour
            await this.prisma.user.update({
                where: { id: user.id },
                data: {
                    passwordResetToken: resetToken,
                    passwordResetExpires: resetTokenExpires,
                },
            });
            // In a real app, you would send an email with the reset link
            this.logger.log(Password, reset, token, generated);
            for ($; { email }; )
                : $;
            {
                resetToken;
            }
            ;
        }
        catch (error) {
            const err = (0, utils_1.toError)(error);
            `
      this.logger.error(Password reset request failed for ${email}`;
            $;
            {
                err.message;
            }
            err.stack;
            ;
            // Don't throw to avoid revealing user existence
        }
    }
    /**
     * Reset password using a token
     */
    async resetPassword(token, newPassword) {
        try {
            const users = await this.prisma.user.findMany({
                where: {
                    passwordResetToken: token,
                    passwordResetExpires: { gt: new Date() },
                },
                take: 1,
            });
            if (!users || users.length === 0) {
                throw new common_1.UnauthorizedException('Invalid or expired password reset token');
            }
            const user = users[0];
            const hashedPassword = await bcrypt.hash(newPassword, this.saltRounds);
            await this.prisma.user.update({
                where: { id: user.id },
                data: {
                    hashedPassword,
                    passwordResetToken: null,
                    passwordResetExpires: null,
                } `
        },`
            });
            this.logger.log(Password, reset, successfully);
            for (user; ; )
                : $;
            {
                user.email;
            }
            `);

    } catch (error) {
      const err = toError(error);
      this.logger.error(Password reset failed: ${err.message}`, err.stack;
            ;
            throw error;
        }
        finally {
        }
    }
    /**
     * Send email verification link
     */
    async sendVerificationEmail(email) {
        try {
            const user = await this.prisma.user.findUnique({ where: { email } });
            if (!user) {
                this.logger.log(Verification, email, requested);
                for (non - existent; user; )
                    : $;
                {
                    email;
                }
                ;
                return;
            }
            `
      if (user.emailVerified) {`;
            this.logger.log(User, email, already, verified, $, { email } `);
        return;
      }

      const verificationToken = (await import('crypto')).randomBytes(32).toString('hex');

      await this.prisma.user.update({
        where: { id: user.id },
        data: { emailVerificationToken: verificationToken },
      });

      // In a real app, you would send an email with the verification link
      this.logger.log(Email verification token generated for ${email}: ${verificationToken});
`);
        }
        catch (error) {
            `
      const err = toError(error);`;
            this.logger.error(Sending, verification, email, failed);
            for ($; { email }; )
                : $;
            {
                err.message;
            }
            err.stack;
            ;
        }
    }
    /**
     * Verify email using a token
     */
    async verifyEmail(token) {
        try {
            const users = await this.prisma.user.findMany({
                where: { emailVerificationToken: token },
                take: 1,
            });
            if (!users || users.length === 0) {
                throw new common_1.UnauthorizedException('Invalid email verification token');
            }
            const user = users[0];
            await this.prisma.user.update({
                where: { id: user.id },
                data: {
                    emailVerified: new Date(),
                    emailVerificationToken: null,
                },
            });
            `
`;
            this.logger.log(Email, verified, successfully);
            for (user; ; )
                : $;
            {
                user.email;
            }
            `);

    } catch (error) {
      const err = toError(error);
      this.logger.error(Email verification failed: ${err.message}, err.stack);
      throw error;
    }
  }

  /**
   * Login user
   */
  async login(loginDto: LoginDto): Promise<AuthResponse> {
    try {
      const { email, password } = loginDto;

      // Find user
      const user = await this.prisma.user.findUnique({
        where: { email }
      });

      if (!user) {
        throw new UnauthorizedException('Invalid credentials');
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(password, user.hashedPassword || '');
      if (!isPasswordValid) {
        throw new UnauthorizedException('Invalid credentials');
      }

      // Generate tokens
      const tokens = await this.generateTokens(user);` `
      this.logger.log(`;
            User;
            logged in successfully;
            $;
            {
                email;
            }
            ;
            // In the login return
            return {
                access_token: tokens.accessToken,
                refresh_token: tokens.refreshToken,
                user: {
                    id: user.id,
                    email: user.email,
                    name: user.name || undefined,
                    emailVerified: user.emailVerified || null,
                },
            };
        }
        catch (error) {
            `
      const err = toError(error);`;
            this.logger.error(Login, failed);
            for ($; { loginDto, : .email } `: ${err.message}, err.stack);
      throw error;
    }
  }

  /**
   * Refresh access token
   */
  async refreshToken(refreshTokenDto: RefreshTokenDto): Promise<AuthResponse> {
    try {
      const { refreshToken } = refreshTokenDto;

      // Verify refresh token
      const payload = await this.jwtService.verifyAsync(refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET || 'refresh-secret-key',
      });

      // Find user
      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub }
      });

      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      // Generate new tokens
      const tokens = await this.generateTokens(user);

      this.logger.log(Token refreshed for user: ${user.email});

      // In the refreshToken method
      return {
        access_token: tokens.accessToken,
        refresh_token: tokens.refreshToken,
        user: {
          id: user.id,
          email: user.email,
          name: user.name || undefined,
          emailVerified: user.emailVerified || null,
        },
      };
    } catch (error) {`; )
                const err = (0, utils_1.toError)(error);
            `
      this.logger.error(Token refresh failed: ${err.message}`, err.stack;
            ;
            throw new common_1.UnauthorizedException('Invalid refresh token');
        }
    }
    /**
     * Validate user by ID
     */
    async validateUser(userId) {
        try {
            return await this.prisma.user.findUnique({
                where: { id: userId }
            });
        }
        catch (error) {
            const err = (0, utils_1.toError)(error);
            this.logger.error(User, validation, failed);
            for (ID; $; { userId })
                : $;
            {
                err.message;
            }
            `, err.stack);
      return null;
    }
  }

  /**
   * Generate access and refresh tokens
   */
  async generateTokens(user: User): Promise<{ accessToken: string; refreshToken: string }> {
    const payload = { email: user.email, sub: user.id };

    const accessToken = this.jwtService.sign(payload, {
      expiresIn: parseInt(process.env.JWT_EXPIRES_IN || '900'), // 15 minutes in seconds
    });

    const refreshToken = this.jwtService.sign(payload, {
      expiresIn: parseInt(process.env.JWT_REFRESH_EXPIRES_IN || '604800'), // 7 days in seconds
      secret: process.env.JWT_REFRESH_SECRET || 'refresh-secret-key',
    });

    return { accessToken, refreshToken };
  }

  /**
   * Hash password utility
   */
  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, this.saltRounds);
  }

  /**
   * Compare password utility
   */
  async comparePassword(password: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
  }
};
        }
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = AuthService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeof (_a = typeof database_1.PrismaService !== "undefined" && database_1.PrismaService) === "function" ? _a : Object, jwt_1.JwtService])
], AuthService);
//# sourceMappingURL=auth.service.js.map