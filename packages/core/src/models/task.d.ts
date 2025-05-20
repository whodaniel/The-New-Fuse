export interface Task {
    id: string;
    title: string;
    description: string;
    status: open' | 'in progress' | 'done';
    createdAt: Date;
    updatedAt: Date;
    priority: high' | 'medium' | 'low';
    dueDate: Date;
}
