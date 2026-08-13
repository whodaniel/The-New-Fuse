import { Test, TestingModule } from '@nestjs/testing';
import { A2AService } from '../src/a2a.service.js';
import { Ap2ProtocolService } from '@the-new-fuse/ap2-protocol';
import { ConfigService } from '@nestjs/config';

describe('A2AService', () => {
  let service: A2AService;
  let ap2ProtocolService: Ap2ProtocolService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        A2AService,
        {
          provide: Ap2ProtocolService,
          useValue: {
            createPayment: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<A2AService>(A2AService);
    ap2ProtocolService = module.get<Ap2ProtocolService>(Ap2ProtocolService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should call the ap2 protocol service to create a payment', async () => {
    const paymentDetails = { amount: 10, currency: 'USD', recipient: 'test' };
    await service.createPayment(paymentDetails);
    expect(ap2ProtocolService.createPayment).toHaveBeenCalledWith(paymentDetails);
  });
});
