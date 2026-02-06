'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
const testing_1 = require('@nestjs/testing');
const ap2_protocol_service_1 = require('../src/ap2-protocol.service');
const axios_1 = require('@nestjs/axios');
const rxjs_1 = require('rxjs');
describe('Ap2ProtocolService', () => {
  let service;
  let httpService;
  beforeEach(async () => {
    const module = await testing_1.Test.createTestingModule({
      providers: [
        ap2_protocol_service_1.Ap2ProtocolService,
        {
          provide: axios_1.HttpService,
          useValue: {
            post: jest.fn(),
          },
        },
      ],
    }).compile();
    service = module.get(ap2_protocol_service_1.Ap2ProtocolService);
    httpService = module.get(axios_1.HttpService);
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
      config: {},
    };
    jest.spyOn(httpService, 'post').mockReturnValueOnce((0, rxjs_1.of)(mockAxiosResponse));
    const result = await service.createPayment(paymentDetails);
    expect(httpService.post).toHaveBeenCalledWith(
      'http://localhost:8000/create_payment',
      paymentDetails
    );
    expect(result).toEqual(mockPaymentRequest);
  });
});
//# sourceMappingURL=ap2-protocol.service.spec.js.map
