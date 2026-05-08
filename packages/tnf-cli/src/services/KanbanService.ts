import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

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

export class KanbanService {
  private readonly boardsDir: string;
  private currentBoard: KanbanBoard | null = null;

  constructor(boardsDir?: string) {
    this.boardsDir = boardsDir || path.join(os.homedir(), '.tnf', 'kanban');
    this.ensureDir();
  }

  private ensureDir(): void {
    fs.mkdirSync(this.boardsDir, { recursive: true });
  }

  private getBoardPath(boardId: string): string {
    return path.join(this.boardsDir, `${boardId}.json`);
  }

  private generateId(): string {
    return `KAN-${Date.now().toString(36).toUpperCase()}`;
  }

  async createBoard(name: string, description?: string): Promise<KanbanBoard> {
    const board: KanbanBoard = {
      id: `board-${Date.now().toString(36)}`,
      name,
      description,
      columns: ['todo', 'doing', 'done'],
      tasks: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await this.saveBoard(board);
    this.currentBoard = board;
    return board;
  }

  async loadBoard(boardId: string): Promise<KanbanBoard> {
    const boardPath = this.getBoardPath(boardId);
    if (!fs.existsSync(boardPath)) {
      throw new Error(`Board not found: ${boardId}`);
    }

    const board = JSON.parse(fs.readFileSync(boardPath, 'utf8'));
    this.currentBoard = board;
    return board;
  }

  async saveBoard(board: KanbanBoard): Promise<void> {
    board.updatedAt = new Date().toISOString();
    fs.writeFileSync(this.getBoardPath(board.id), JSON.stringify(board, null, 2));
  }

  async listBoards(): Promise<KanbanBoard[]> {
    const files = fs.readdirSync(this.boardsDir).filter((f) => f.endsWith('.json'));
    return files.map((f) => {
      const content = fs.readFileSync(path.join(this.boardsDir, f), 'utf8');
      return JSON.parse(content);
    });
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
    const board = this.currentBoard || (await this.getDefaultBoard());

    const task: KanbanTask = {
      id: this.generateId(),
      title,
      description: options.description,
      column: options.column || 'todo',
      priority: options.priority || 'medium',
      agent: options.agent,
      tags: options.tags || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      assignedTo: options.agent,
    };

    board.tasks.push(task);
    await this.saveBoard(board);
    return task;
  }

  async moveTask(taskId: string, newColumn: 'todo' | 'doing' | 'done'): Promise<KanbanTask> {
    const board = this.currentBoard || (await this.getDefaultBoard());
    const task = board.tasks.find((t) => t.id === taskId);

    if (!task) {
      throw new Error(`Task not found: ${taskId}`);
    }

    task.column = newColumn;
    task.updatedAt = new Date().toISOString();
    await this.saveBoard(board);
    return task;
  }

  async getTasks(column?: 'todo' | 'doing' | 'done'): Promise<KanbanTask[]> {
    const board = this.currentBoard || (await this.getDefaultBoard());
    if (column) {
      return board.tasks.filter((t) => t.column === column);
    }
    return board.tasks;
  }

  async getAllTasks(): Promise<Record<string, KanbanTask[]>> {
    const board = this.currentBoard || (await this.getDefaultBoard());
    const tasks: Record<string, KanbanTask[]> = { todo: [], doing: [], done: [] };

    for (const task of board.tasks) {
      tasks[task.column].push(task);
    }

    return tasks;
  }

  async deleteTask(taskId: string): Promise<void> {
    const board = this.currentBoard || (await this.getDefaultBoard());
    const index = board.tasks.findIndex((t) => t.id === taskId);

    if (index === -1) {
      throw new Error(`Task not found: ${taskId}`);
    }

    board.tasks.splice(index, 1);
    await this.saveBoard(board);
  }

  async updateTask(
    taskId: string,
    updates: Partial<Omit<KanbanTask, 'id' | 'createdAt'>>
  ): Promise<KanbanTask> {
    const board = this.currentBoard || (await this.getDefaultBoard());
    const task = board.tasks.find((t) => t.id === taskId);

    if (!task) {
      throw new Error(`Task not found: ${taskId}`);
    }

    Object.assign(task, updates, { updatedAt: new Date().toISOString() });
    await this.saveBoard(board);
    return task;
  }

  private async getDefaultBoard(): Promise<KanbanBoard> {
    const boards = await this.listBoards();
    if (boards.length > 0) {
      this.currentBoard = boards[0];
      return boards[0];
    }

    // Create default board
    return await this.createBoard('Default Board', 'Default Kanban board');
  }
}
