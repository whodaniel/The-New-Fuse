import { Module, forwardRef } from '@nestjs/common'; // Import forwardRef if JwtAuthGuard depends on UserService etc.
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt'; // Assuming JwtAuthGuard needs JwtService
import { PassportModule } from '@nestjs/passport'; // Assuming JwtAuthGuard uses Passport

import { ApiKeyAuthGuard } from './guards/api-key-auth.guard.js';
import { JwtAuthGuard } from './guards/jwt-auth.guard.js'; // Assuming this exists
import { JwtStrategy } from './strategies/jwt.strategy.js'; // Assuming this exists
import { ServiceOrUserAuthGuard } from './guards/service-or-user-auth.guard.js'; // Import the new guard
// Import other necessary modules like UserModule if needed by JwtStrategy/JwtAuthGuard
// import { UserModule } from '../user/user.module.js';

@Module({
  imports: [
    ConfigModule,
    PassportModule, // Needed for Passport strategies like JWT
    JwtModule.registerAsync({ // Example configuration for JWT
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: configService.get<string>('JWT_EXPIRES_IN', '60m') },
      }),
      inject: [ConfigService],
    }),
    // forwardRef(() => UserModule), // Example if UserModule is needed and causes circular dependency
  ],
  providers: [
    ApiKeyAuthGuard,
    JwtAuthGuard, // Ensure JwtAuthGuard is provided
    JwtStrategy, // Ensure JwtStrategy is provided
    ServiceOrUserAuthGuard, // Provide the new combined guard
  ],
  exports: [
    ApiKeyAuthGuard,
    JwtAuthGuard,
    ServiceOrUserAuthGuard, // Export the new combined guard
    PassportModule, // Export PassportModule if needed by other modules using guards
    JwtModule, // Export JwtModule if needed elsewhere
  ],
})
export class AuthModule {}
