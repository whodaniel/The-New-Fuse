export declare class Pipeline {
    id: string;
    name: string;
    description?: string;
    configuration: Record<string, any>;
    status: 'active' | 'inactive' | 'error';
    createdAt: Date;
    updatedAt: Date;
}
//# sourceMappingURL=Pipeline.d.ts.map