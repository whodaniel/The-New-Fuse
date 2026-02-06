import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { SupabaseService } from '../SupabaseService';

describe('SupabaseService', () => {
  let service: SupabaseService;

  const mockConfigService = {
    get: jest.fn((key: string) => {
      if (key === 'SUPABASE_URL') {
        return 'https://test.supabase.co';
      }
      if (key === 'SUPABASE_KEY') {
        return 'test_key';
      }
      return null;
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SupabaseService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<SupabaseService>(SupabaseService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should create a Supabase client', () => {
    expect(service.getClient()).toBeDefined();
  });
});
