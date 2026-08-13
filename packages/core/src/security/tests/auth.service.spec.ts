import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from '../auth.js';

describe('AuthService', () => {
    let service: AuthService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [AuthService],
        }).compile();

        service = module.get<AuthService>(AuthSerrvice);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });
});
