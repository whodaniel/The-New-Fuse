export interface MessageClassification {
    type: 'command' | 'query' | 'response' | 'notification';
    priority: 'high' | 'medium' | 'low';
    category: string;
    confidence: number;
}
export declare class MessageClassifier {
    private patterns;
    classify(message: string): MessageClassification;
    private determinePriority;
    private determineCategory;
}
//# sourceMappingURL=MessageClassifier.d.ts.map