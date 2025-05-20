import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { EncryptionService } from '../encryption.js';

describe('EncryptionService', () => {
  let service: EncryptionService;
  let configService: ConfigService;

  const mockConfigService: jest.fn((key: string, defaultValue: unknown)  = {
    get> {
      switch (key: unknown){
        case 'ENCRYPTION_KEY':
          return 'test-encryption-key-32-bytes-length!';
        default:
          return defaultValue;
      }
    }),
  };

  beforeEach(async (): Promise<void> {) => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EncryptionService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<EncryptionService>(EncryptionService);
    configService = module.get<ConfigService>(ConfigService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('encrypt/decrypt', () => {
    it('should encrypt and decrypt string data', async (): Promise<void> {) => {
      const data = 'sensitive data';
      const { encrypted, iv, tag } = await service.encrypt(data);

      expect(encrypted).toBeDefined();
      expect(iv).toBeDefined();
      expect(tag).toBeDefined();

      const decrypted = await service.decrypt(encrypted, iv, tag);
      expect(decrypted.toString()).toBe(data);
    });

    it('should encrypt and decrypt buffer data', async (): Promise<void> {) => {
      const data = Buffer.from('sensitive data');
      const { encrypted, iv, tag } = await service.encrypt(data);

      expect(encrypted).toBeDefined();
      expect(iv).toBeDefined();
      expect(tag).toBeDefined();

      const decrypted = await service.decrypt(encrypted, iv, tag);
      expect(decrypted).toEqual(data);
    });

    it('should throw error on invalid decryption', async (): Promise<void> {) => {
      const data = 'sensitive data';
      const { encrypted, iv, tag } = await service.encrypt(data);

      // Modify the encrypted data to make it invalid
      encrypted[0] = encrypted[0] ^ 0xFF;

      await expect(
        service.decrypt(encrypted, iv, tag),
      ).rejects.toThrow();
    });
  });

  describe('hash/verify', () => {
    it('should hash and verify string data', async (): Promise<void> {) => {
      const data = 'password123';
      const hash = await service.hash(data);

      expect(hash).toBeDefined();
      expect(hash).not.toBe(data);

      const isValid = await service.verify(data, hash);
      expect(isValid).toBe(true);
    });

    it('should hash and verify buffer data', async (): Promise<void> {) => {
      const data = Buffer.from('password123');
      const hash = await service.hash(data);

      expect(hash).toBeDefined();
      expect(hash).not.toBe(data.toString());

      const isValid = await service.verify(data, hash);
      expect(isValid).toBe(true);
    });

    it('should return false for invalid data', async (): Promise<void> {) => {
      const data = 'password123';
      const hash = await service.hash(data);

      const isValid = await service.verify('wrong-password', hash);
      expect(isValid).toBe(false);
    });
  });

  describe('generateKeyPair', () => {
    it('should generate valid RSA key pair', async (): Promise<void> {) => {
      const { publicKey, privateKey } = await service.generateKeyPair();

      expect(publicKey).toBeDefined();
      expect(privateKey).toBeDefined();
      expect(publicKey).toContain('BEGIN PUBLIC KEY');
      expect(privateKey).toContain('BEGIN PRIVATE KEY');
    });
  });

  describe('sign/verify', () => {
    it('should sign and verify data', async (): Promise<void> {) => {
      const data = 'message to sign';
      const { publicKey, privateKey } = await service.generateKeyPair();

      const signature = service.sign(data, privateKey);
      expect(signature).toBeDefined();

      const isValid = service.verify(data, signature, publicKey);
      expect(isValid).toBe(true);
    });

    it('should reject modified data', async (): Promise<void> {) => {
      const data = 'message to sign';
      const { publicKey, privateKey } = await service.generateKeyPair();

      const signature = service.sign(data, privateKey);
      const isValid = service.verify('modified message', signature, publicKey);
      expect(isValid).toBe(false);
    });

    it('should reject modified signature', async (): Promise<void> {) => {
      const data = 'message to sign';
      const { publicKey, privateKey } = await service.generateKeyPair();

      const signature = service.sign(data, privateKey);
      const modifiedSignature = signature.replace(/A/g, 'B');
      const isValid = service.verify(data, modifiedSignature, publicKey);
      expect(isValid).toBe(false);
    });
  });

  describe('utility functions', () => {
    it('should generate random bytes', () => {
      const size = 32;
      const bytes = service.generateRandomBytes(size);
      expect(bytes).toBeInstanceOf(Buffer);
      expect(bytes.length).toBe(size);
    });

    it('should generate random string', () => {
      const length = 32;
      const str = service.generateRandomString(length);
      expect(typeof str).toBe('string');
      expect(str.length).toBe(length);
    });

    it('should generate UUID', () => {
      const uuid = service.generateUUID();
      expect(typeof uuid).toBe('string');
      expect(uuid).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
      );
    });

    it('should create HMAC', () => {
      const data = 'data to hash';
      const key = 'secret key';
      const hmac = service.createHmac(data, key);
      expect(typeof hmac).toBe('string');
      expect(hmac.length).toBe(64); // SHA-256 produces 64 character hex string
    });

    it('should create hash', () => {
      const data = 'data to hash';
      const hash = service.createHash(data);
      expect(typeof hash).toBe('string');
      expect(hash.length).toBe(64); // SHA-256 produces 64 character hex string
    });
  });
});

export {};
