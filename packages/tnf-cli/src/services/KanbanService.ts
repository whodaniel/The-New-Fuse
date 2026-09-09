import { UnifiedLedgerClient } from './UnifiedLedgerClient.js';

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
  /** Owning authenticated TNF account (cloud identity key). */
  ownerAccountId?: string;
  /** Stable per-user id (profile_id) owning this task. */
  ownerUserId?: string;
}

export interface KanbanBoard {
  id: string;
  name: string;
  description?: string;
  columns: ['todo', 'doing', 'done'];
  tasks: KanbanTask[];
  createdAt: string;
  updatedAt: string;
  /** Owning authenticated TNF account (cloud identity key). */
  ownerAccountId?: string;
  /** Stable per-user id (profile_id) owning this board. */
  ownerUserId?: string;
}

/** A board is a plan; its cards are projections of that plan's linked records. */
export class KanbanService {
  private currentBoardId: string | null = null;
  private readonly ledger: UnifiedLedgerClient;
  constructor(client?: UnifiedLedgerClient | string) {
    if (typeof client === 'string')
      throw new Error(
        'Local Kanban directories are legacy data; use an authenticated ledger client and explicit migration'
      );
    this.ledger = client || new UnifiedLedgerClient();
  }
  private task(row: any): KanbanTask {
    return {
      id: row.id,
      title: row.title,
      description: row.description,
      column:
        row.status === 'completed'
          ? 'done'
          : ['in_progress', 'under_review'].includes(row.status)
            ? 'doing'
            : 'todo',
      priority: ['critical', 'urgent', 'high'].includes(row.priority)
        ? 'high'
        : row.priority === 'low'
          ? 'low'
          : 'medium',
      agent: row.assignee,
      assignedTo: row.assignee,
      tags: row.tags,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }
  private async project(plan: any, loadedRecords?: any[]): Promise<KanbanBoard> {
    const records = loadedRecords || (await this.ledger.request<any[]>('GET', 'records'));
    const ids = new Set(plan.linkedRecordIds || []);
    return {
      id: plan.id,
      name: plan.name,
      description: plan.objective,
      columns: ['todo', 'doing', 'done'],
      tasks: records
        .filter((row) => ids.has(row.id) && row.kind === 'task' && row.status !== 'archived')
        .map((row) => this.task(row)),
      createdAt: plan.createdAt,
      updatedAt: plan.updatedAt,
    };
  }
  async createBoard(name: string, description?: string): Promise<KanbanBoard> {
    const plan = await this.ledger.request<any>('POST', 'plans', {
      name,
      objective: description || '',
      metadata: { view: 'kanban' },
    });
    this.currentBoardId = plan.id;
    return this.project(plan);
  }
  async loadBoard(boardId: string): Promise<KanbanBoard> {
    const plan = await this.ledger.request<any>('GET', `plans/${encodeURIComponent(boardId)}`);
    if (!plan) throw new Error(`Board not found: ${boardId}`);
    this.currentBoardId = plan.id;
    return this.project(plan);
  }
  async listBoards(): Promise<KanbanBoard[]> {
    const [plans, records] = await Promise.all([
      this.ledger.request<any[]>('GET', 'plans'),
      this.ledger.request<any[]>('GET', 'records'),
    ]);
    return Promise.all(
      plans.filter((plan) => plan.status !== 'archived').map((plan) => this.project(plan, records))
    );
  }
  private async current(): Promise<KanbanBoard> {
    if (this.currentBoardId) return this.loadBoard(this.currentBoardId);
    const boards = await this.listBoards();
    if (boards.length) {
      this.currentBoardId = boards[0].id;
      return boards[0];
    }
    return this.createBoard('Default Board', 'Default Kanban board');
  }
  async addTask(
    title: string,
    options: {
      column?: 'todo' | 'doing' | 'done';
      priority?: 'low' | 'medium' | 'high';
      agent?: string;
      description?: string;
      tags?: string[];
    } = {}
  ): Promise<KanbanTask> {
    const board = await this.current();
    const row = await this.ledger.request<any>(
      'POST',
      `plans/${encodeURIComponent(board.id)}/tasks`,
      {
        title,
        description: options.description || '',
        priority: options.priority || 'medium',
        assignee: options.agent,
        tags: options.tags || [],
        status: this.status(options.column || 'todo'),
      }
    );
    return this.task(row);
  }
  private status(column: 'todo' | 'doing' | 'done'): string {
    if (!['todo', 'doing', 'done'].includes(column)) throw new Error('Invalid Kanban column');
    return { todo: 'queued', doing: 'in_progress', done: 'completed' }[column];
  }
  async updateTask(
    taskId: string,
    updates: Partial<Omit<KanbanTask, 'id' | 'createdAt'>>
  ): Promise<KanbanTask> {
    const board = await this.current();
    if (!board.tasks.some((task) => task.id === taskId))
      throw new Error(`Task not found: ${taskId}`);
    const patch: Record<string, unknown> = {};
    for (const key of ['title', 'description', 'priority', 'tags'] as const)
      if (updates[key] !== undefined) patch[key] = updates[key];
    if (updates.column !== undefined) patch.status = this.status(updates.column);
    if (updates.agent !== undefined || updates.assignedTo !== undefined)
      patch.assignee = updates.assignedTo ?? updates.agent;
    const row = await this.ledger.request<any>(
      'PATCH',
      `records/${encodeURIComponent(taskId)}`,
      patch
    );
    if (!row) throw new Error(`Task not found: ${taskId}`);
    return this.task(row);
  }
  async moveTask(taskId: string, column: 'todo' | 'doing' | 'done'): Promise<KanbanTask> {
    return this.updateTask(taskId, { column });
  }
  async getTasks(column?: 'todo' | 'doing' | 'done'): Promise<KanbanTask[]> {
    const tasks = (await this.current()).tasks;
    return column ? tasks.filter((task) => task.column === column) : tasks;
  }
  async getAllTasks(): Promise<Record<string, KanbanTask[]>> {
    const tasks = await this.getTasks();
    return {
      todo: tasks.filter((t) => t.column === 'todo'),
      doing: tasks.filter((t) => t.column === 'doing'),
      done: tasks.filter((t) => t.column === 'done'),
    };
  }
  async deleteTask(taskId: string): Promise<void> {
    if (!(await this.current()).tasks.some((task) => task.id === taskId))
      throw new Error(`Task not found: ${taskId}`);
    await this.ledger.request('PATCH', `records/${encodeURIComponent(taskId)}`, {
      status: 'archived',
    });
  }
}
