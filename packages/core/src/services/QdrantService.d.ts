import { ConfigService } from '@nestjs/config';
export declare class QdrantService {
    private readonly configService;
    private readonly client;
    private readonly config;
    private readonly embeddings;
    constructor(configService: ConfigService);
}
