import { TaskStatus } from './index';
import { TaskPriority } from './core/enums';
export interface Task {
    id: string;
    name: string;
    description?: string;
    type: string;
    status: TaskStatus;
    priority: TaskPriority;
    metadata: Record<string, unknown>;
    createdAt: Date;
    updatedAt: Date;
}
//# sourceMappingURL=entities.d.ts.map