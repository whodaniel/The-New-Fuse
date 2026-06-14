export interface KanbanTask {
    id: string;
    title: string;
    description?: string;
    column: 'todo' | 'doing' | 'done';
    priority: 'low' | 'medium' | 'high';
    agent?: string;
    tags?: string[];
    createdAt: string;
    updatedAt: string;
    assignedTo?: string;
}
export interface KanbanBoard {
    id: string;
    name: string;
    description?: string;
    columns: ['todo', 'doing', 'done'];
    tasks: KanbanTask[];
    createdAt: string;
    updatedAt: string;
}
export declare class KanbanService {
    private readonly boardsDir;
    private currentBoard;
    constructor(boardsDir?: string);
    private ensureDir;
    private getBoardPath;
    private generateId;
    createBoard(name: string, description?: string): Promise<KanbanBoard>;
    loadBoard(boardId: string): Promise<KanbanBoard>;
    saveBoard(board: KanbanBoard): Promise<void>;
    listBoards(): Promise<KanbanBoard[]>;
    addTask(title: string, options?: {
        column?: 'todo' | 'doing' | 'done';
        priority?: 'low' | 'medium' | 'high';
        agent?: string;
        description?: string;
        tags?: string[];
    }): Promise<KanbanTask>;
    moveTask(taskId: string, newColumn: 'todo' | 'doing' | 'done'): Promise<KanbanTask>;
    getTasks(column?: 'todo' | 'doing' | 'done'): Promise<KanbanTask[]>;
    getAllTasks(): Promise<Record<string, KanbanTask[]>>;
    deleteTask(taskId: string): Promise<void>;
    updateTask(taskId: string, updates: Partial<Omit<KanbanTask, 'id' | 'createdAt'>>): Promise<KanbanTask>;
    private getDefaultBoard;
}
//# sourceMappingURL=KanbanService.d.ts.map