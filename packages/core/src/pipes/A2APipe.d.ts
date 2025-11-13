import { PipeTransform, ArgumentMetadata } from '@nestjs/common';
import { A2AService } from '../services/A2AService';
export declare class A2AMessagePipe implements PipeTransform {
    private readonly a2aService;
    private logger;
    constructor(a2aService: A2AService);
    transform(value: any, metadata: ArgumentMetadata): Promise<any>;
    private isA2AMessage;
    private isAgentRegistration;
    private isAgentDiscovery;
    private validateA2AMessage;
    private validateAgentRegistration;
    private validateAgentDiscovery;
    private isBase64;
}
export declare class A2AAgentIdPipe implements PipeTransform {
    private readonly a2aService;
    private logger;
    constructor(a2aService: A2AService);
    transform(value: any, metadata: ArgumentMetadata): Promise<any>;
}
export { A2AMessagePipe as A2APipe };
//# sourceMappingURL=A2APipe.d.ts.map