import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
@Module({
  // Implementation needed
}
  imports: [
    ConfigModule,
    JwtModule.registerAsync({
  // Implementation needed
}
      imports: [ConfigModule],
      async useFactory(configService: ConfigService) => ({
  // Implementation needed
}
        secret: configService.get<string>('JWT_SECRET') || 'default-secret',
        signOptions: {
  // Implementation needed
}
          expiresIn: configService.get<string>('JWT_EXPIRES_IN') || '24h',
        },
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [AuthService],
  exports: [AuthService, JwtModule],
})
export class AuthModule {}