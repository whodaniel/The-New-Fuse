import { PipelineDefinition } from '../types/pipeline';
import { Logger } from 'winston';
/**
 * Pipeline Validator ensures pipeline configurations are valid and safe to execute
 */
export declare class PipelineValidator {
    private logger;
    constructor(logger: Logger);
    /**
     * Validate a complete pipeline definition
     */
    validatePipeline(pipeline: PipelineDefinition): Promise<{
        valid: boolean;
        errors: string[];
    }>;
    catch(error: any): {
        valid: boolean;
        errors: any;
    };
}
//# sourceMappingURL=PipelineValidator.d.ts.map