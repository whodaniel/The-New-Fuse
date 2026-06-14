export interface ComponentAnalysisEvent {
    componentId: string;
    analysisType: string;
    result: any;
    timestamp: Date;
}
export declare class ComponentAnalysisSubscriber {
    private subscribers;
    subscribe(componentId: string, callback: (event: ComponentAnalysisEvent) => void): void;
    unsubscribe(componentId: string, callback: (event: ComponentAnalysisEvent) => void): void;
    notify(event: ComponentAnalysisEvent): void;
}
//# sourceMappingURL=ComponentAnalysisSubscriber.d.ts.map