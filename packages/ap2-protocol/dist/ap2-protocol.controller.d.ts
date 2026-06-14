import { Ap2ProtocolService } from './ap2-protocol.service.js';
export declare class Ap2ProtocolController {
    private readonly ap2ProtocolService;
    private readonly logger;
    constructor(ap2ProtocolService: Ap2ProtocolService);
    getHealth(): string;
    createPayment(paymentDetails: {
        value: number;
        currency: string;
    }): Promise<any>;
}
