export interface Todo {
    id: string;
    title: string;
    description: string;
    status: 'TODO' | 'IN_PROGRESS' | 'DONE';
    createdAt: Date;
    assignedTo?: string;
    dueDate?: Date;
    featureId?: string;
    suggestionId?: string;
}
//# sourceMappingURL=types.d.ts.map