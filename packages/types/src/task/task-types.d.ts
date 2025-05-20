import { TaskPriority, TaskStatus, TaskType } from '../core/enums.js';
export type UUID = string;
export type ISODateTime = string;
export interface BaseEntity {
    id: UUID;
    createdAt: ISODateTime;
    updatedAt: ISODateTime;
}
export { TaskStatus, TaskType, TaskPriority };
//# sourceMappingURL=task-types.d.ts.map