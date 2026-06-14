import { Logger } from '@nestjs/common';
export declare abstract class LLMProvider {
    protected readonly logger: Logger;
    abstract generate(prompt: string): Promise<string>;
}
//# sourceMappingURL=LLMProvider.d.ts.map