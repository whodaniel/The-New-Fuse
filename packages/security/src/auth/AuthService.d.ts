import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma.service';
import { HashingService } from './hashing.service';
export declare class AuthService {
    private readonly jwt;
    private readonly prisma;
    private readonly hashingService;
    constructor(jwt: JwtService, prisma: PrismaService, hashingService: HashingService);
    validateToken(): Promise<void>;
}
