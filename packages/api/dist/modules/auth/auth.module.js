var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ApiKeyAuthGuard } from './guards/api-key-auth.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { JwtStrategy } from './strategies/jwt.strategy';
import { ServiceOrUserAuthGuard } from './guards/service-or-user-auth.guard';
let AuthModule = class AuthModule {
};
AuthModule = __decorate([
    Module({
        imports: [
            ConfigModule,
            PassportModule,
            JwtModule.registerAsync({
                imports: [ConfigModule],
                useFactory: async (configService) => {
                    return {
                        secret: configService.get('JWT_SECRET'),
                        signOptions: {
                            expiresIn: 3600 // 1 hour in seconds
                        },
                    };
                },
                inject: [ConfigService],
            }),
        ],
        providers: [
            ApiKeyAuthGuard,
            JwtAuthGuard,
            JwtStrategy,
            ServiceOrUserAuthGuard,
        ],
        exports: [
            ApiKeyAuthGuard,
            JwtAuthGuard,
            ServiceOrUserAuthGuard,
            PassportModule,
            JwtModule,
        ],
    })
], AuthModule);
export { AuthModule };
//# sourceMappingURL=auth.module.js.map