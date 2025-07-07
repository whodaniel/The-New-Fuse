import { ConfigService } from '@nestjs/config';
export declare class MemoryClustering {
    private readonly configService;
    constructor(configService: ConfigService);
    clusterItems(items: any[]): Promise<any[]>;
    analyzeContent(item: any): Promise<string[]>;
}
//# sourceMappingURL=memory-clustering.d.ts.map