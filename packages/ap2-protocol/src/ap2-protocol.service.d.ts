import { HttpService } from '@nestjs/axios';
export declare class Ap2ProtocolService {
    private readonly httpService;
    private readonly logger;
    private readonly pythonServerUrl;
    constructor(httpService: HttpService);
    createPayment(paymentDetails: {
        value: number;
        currency: string;
    }): Promise<any>;
}
//# sourceMappingURL=ap2-protocol.service.d.ts.map