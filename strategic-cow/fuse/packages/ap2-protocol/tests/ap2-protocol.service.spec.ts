import { Test, TestingModule } from '@nestjs/testing';
import { Ap2ProtocolService } from '../src/ap2-protocol.service';
import { HttpService } from '@nestjs/axios';
import { of } from 'rxjs';

describe('Ap2ProtocolService', () => {
  let service: Ap2ProtocolService;
  let httpService: HttpService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        Ap2ProtocolService,
        {
          provide: HttpService,
          useValue: {
            post: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<Ap2ProtocolService>(Ap2ProtocolService);
    httpService = module.get<HttpService>(HttpService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should call the http service to create a payment', async () => {
    const paymentDetails = { value: 10, currency: 'USD' };
    const mockPaymentRequest = {
      method_data: [],
      details: {
        id: '123',
        display_items: [],
        total: {
          label: 'Total',
          amount: {
            currency: 'USD',
            value: 10,
          },
        },
      },
    };
    const mockAxiosResponse = {
      data: mockPaymentRequest,
      status: 200,
      statusText: 'OK',
      headers: {},
      config: {} as any,
    };
    jest.spyOn(httpService, 'post').mockReturnValueOnce(of(mockAxiosResponse));

    const result = await service.createPayment(paymentDetails);

    expect(httpService.post).toHaveBeenCalledWith('http://localhost:8000/create_payment', paymentDetails);
    expect(result).toEqual(mockPaymentRequest);
  });
});
