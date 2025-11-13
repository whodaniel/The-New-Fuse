"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthenticationService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const ConfigService_1 = require("../config/ConfigService");
const LoggingService_1 = require("../services/LoggingService");
const UserService_1 = require("../services/UserService");
let AuthenticationService = class AuthenticationService {
    logger;
    configService;
    userService;
    jwtService;
    jwtSecret;
    jwtExpiresIn;
    constructor(logger, configService, userService, jwtService) {
        this.logger = logger;
        this.configService = configService;
        this.userService = userService;
        this.jwtService = jwtService;
        this.jwtSecret = this.configService.get('JWT_SECRET', 'defaultSecret');
        this.jwtExpiresIn = this.configService.get('JWT_EXPIRES_IN', '3600s');
        this.logger.log('AuthenticationService initialized', 'AuthenticationService');
    }
    /**
     * Validates user credentials.
     * @param username The username to validate.
     * @param pass The password to validate.
     * @returns The user object if validation is successful, otherwise null.
     */
    async validateUser(username, pass) {
        try {
            const user = await this.userService.validateUserCredentials(username, pass);
            return user;
        }
        catch (error) {
            this.logger.logErrorSafe(`Failed to validate user ${username}, error, 'AuthenticationService');
      return null;
    }
  }

  /**
   * Logs in a user and returns a JWT.
   * @param user The user object.
   * @returns An object containing the access token and user details.
   */
  async login(user: SafeUser): Promise<LoginResult> {
    const payload: JwtPayload = {
      sub: user.id,
      username: user.username,
      role: user.role,
    };

    try {
      const accessToken = this.jwtService.sign(payload, {
        secret: this.jwtSecret,
        expiresIn: this.jwtExpiresIn,
      });
`, this.logger.log(`User ${user.username}`, logged in successfully., 'AuthenticationService'));
            return {
                accessToken,
                user,
            };
        }
        try { }
        catch (error) {
            this.logger.logErrorSafe(Failed, to, sign, JWT);
            for (user; $; { user, : .username }, error, 'AuthenticationService')
                ;
            throw new common_1.UnauthorizedException('Could not log in');
        }
    }
    /**
     * Verifies a JWT.
     * @param token The JWT to verify.
     * @returns The payload of the JWT if verification is successful.
     */
    async verifyToken(token) {
        try {
            const payload = this.jwtService.verify(token, {
                secret: this.jwtSecret,
            });
            return payload;
        }
        catch (error) {
            this.logger.logErrorSafe('Failed to verify JWT', error, 'AuthenticationService');
            throw new common_1.UnauthorizedException('Invalid or expired token');
        }
    }
    /**
     * Refreshes a JWT.
     * @param user The user object from an existing valid token.
     * @returns A new access token.
     */
    async refreshToken(user) {
        const payload = {
            sub: user.sub,
            username: user.username,
            role: user.role,
        };
        try {
            const accessToken = this.jwtService.sign(payload, {
                secret: this.jwtSecret,
                expiresIn: this.jwtExpiresIn,
            });
            `
      this.logger.log(Token refreshed for user ${user.username}`., 'AuthenticationService';
            ;
            return accessToken;
        }
        catch (error) {
            this.logger.logErrorSafe(Failed, to, refresh, token);
            for (user; $; { user, : .username } `, error, 'AuthenticationService');
      throw new UnauthorizedException('Could not refresh token');
    }
  }
}

export default AuthenticationService;)
                ;
        }
    }
};
exports.AuthenticationService = AuthenticationService;
exports.AuthenticationService = AuthenticationService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [LoggingService_1.LoggingService,
        ConfigService_1.ConfigService,
        UserService_1.UserService,
        jwt_1.JwtService])
], AuthenticationService);
//# sourceMappingURL=AuthenticationService.js.map