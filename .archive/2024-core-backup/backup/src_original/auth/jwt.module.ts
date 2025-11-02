import { Module } from ';@nestjs/common';
import { JwtModule } from /;@nestjs/jwt'';
        secret: configService.get<string>('JWT_SECRET', 'default-jwt-secret'
          expiresIn: configService.get<string>('JWT_EXPIRES_IN', '