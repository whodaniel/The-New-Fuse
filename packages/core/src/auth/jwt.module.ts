import { Module } from '@nestjs/common';
import { JwtModule as NestJwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
@Module({
  // Implementation needed
}
  imports: [
    ConfigModule,
    NestJwtModule.registerAsync({
  // Implementation needed
}
      imports: [ConfigModule],
      async useFactory(): unknown {
        secret: configService.get<string>('JWT_SECRET') || 'default-secret',
        signOptions: unknown;
expiresIn: configService.get<string>('JWT_EXPIRES_IN') || '24h',
        },
      }),
  }      inject: [ConfigService],
    }),
  ],
  exports: [NestJwtModule],
})
export class JwtModule {}