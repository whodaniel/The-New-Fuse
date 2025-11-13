import { Response } from 'express';
import { ApiDocGeneratorService } from './api-doc-generator.service';
export declare class DocsController {
    private readonly docGeneratorService;
    constructor(docGeneratorService: ApiDocGeneratorService);
    getOpenAPISpec(res: Response): Promise<void>;
    getSwaggerUI(res: Response): Promise<void>;
    return: any;
}
//# sourceMappingURL=docs.controller.d.ts.map