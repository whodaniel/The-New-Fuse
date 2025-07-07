export declare enum MemoryType {
    CONVERSATION = "conversation",
    CONTEXT = "context",
    KNOWLEDGE = "knowledge",
    WORKFLOW = "workflow"
}
export declare class Memory {
    id: string;
    content: string;
    type: MemoryType;
    metadata: Record<string, any>;
    importance: number;
    tags: string[];
    searchVector: string;
    createdAt: Date;
    updatedAt: Date;
}
//# sourceMappingURL=memory.entity.d.ts.map