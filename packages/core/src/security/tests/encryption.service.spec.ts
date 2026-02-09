import { Test, TestingModule } from '@nestjs/testing';
import { EncryptionService } from '../encryption';

describe('EncryptionService', () => {
    let service: EncryptionService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [EncryptionService],
        }).compile();

        service = module.get<EncryptionService>(EncryptionService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    it('should encrypt and decrypt a string', () => {
        const text = 'hello world';
        const encrypted = service.encrypt(text);
        const decrypted = service.decrypt(encrypted);
        expect(decrypted).toBe(text);
    });
});
