export declare class ModelsController {
    getAllModels(provider?: string): Promise<never[]>;
    getProviders(): Promise<{
        id: string;
        name: string;
        models: string[];
    }[]>;
    getModelById(id: string): Promise<{
        id: string;
    }>;
    selectModel(selection: {
        modelId: string;
        provider: string;
    }): Promise<{
        modelId: string;
        provider: string;
        message: string;
    }>;
    getActiveModel(): Promise<{
        modelId: string;
        provider: string;
    }>;
    testModel(id: string): Promise<{
        success: boolean;
        message: string;
    }>;
}
//# sourceMappingURL=models.controller.d.ts.map