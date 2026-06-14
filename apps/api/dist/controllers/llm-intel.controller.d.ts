export declare class LLMIntelController {
    getRankingRecommendations(): Promise<any>;
    getArenaIntelLatest(): Promise<any>;
    getRankingReport(): Promise<{
        report: string;
    } | {
        report: null;
    }>;
    getHistory(): Promise<{
        file: string;
        data: any;
    }[]>;
}
//# sourceMappingURL=llm-intel.controller.d.ts.map