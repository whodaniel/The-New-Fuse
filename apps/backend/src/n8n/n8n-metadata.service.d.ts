import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
export declare class N8nMetadataService {
    private readonly httpService;
    private readonly configService;
    private readonly logger;
    constructor(httpService: HttpService, configService: ConfigService);
    getAllNodeTypes(): Promise<any>;
    getNodeTypeDescription(nodeType: string): Promise<any>;
    getCredentialTypes(): Promise<any>;
}
