interface ImprovementMessage {
    type: 'improvement';
    component: string;
    description: string;
    priority: 'low' | 'medium' | 'high';
    metadata?: Record<string, any>;
}
export declare function sendImprovementMessage(component: string, description: string, priority?: ImprovementMessage['priority'], metadata?: Record<string, any>): Promise<void>;
export {};
