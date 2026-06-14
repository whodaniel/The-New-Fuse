export declare class SkillsService {
    private readonly skillBankPath;
    private llm;
    constructor(projectRoot: string);
    private getLlm;
    ensureBank(): Promise<void>;
    compile(prompt: string, filePaths?: string[]): Promise<{
        path: string;
        name: any;
    }>;
    listCompiled(): Promise<string[]>;
}
//# sourceMappingURL=SkillsService.d.ts.map