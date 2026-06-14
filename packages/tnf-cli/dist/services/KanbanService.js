import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
export class KanbanService {
    constructor(boardsDir) {
        this.currentBoard = null;
        this.boardsDir = boardsDir || path.join(os.homedir(), '.tnf', 'kanban');
        this.ensureDir();
    }
    ensureDir() {
        fs.mkdirSync(this.boardsDir, { recursive: true });
    }
    getBoardPath(boardId) {
        return path.join(this.boardsDir, `${boardId}.json`);
    }
    generateId() {
        return `KAN-${Date.now().toString(36).toUpperCase()}`;
    }
    async createBoard(name, description) {
        const board = {
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
    async loadBoard(boardId) {
        const boardPath = this.getBoardPath(boardId);
        if (!fs.existsSync(boardPath)) {
            throw new Error(`Board not found: ${boardId}`);
        }
        const board = JSON.parse(fs.readFileSync(boardPath, 'utf8'));
        this.currentBoard = board;
        return board;
    }
    async saveBoard(board) {
        board.updatedAt = new Date().toISOString();
        fs.writeFileSync(this.getBoardPath(board.id), JSON.stringify(board, null, 2));
    }
    async listBoards() {
        const files = fs.readdirSync(this.boardsDir).filter((f) => f.endsWith('.json'));
        return files.map((f) => {
            const content = fs.readFileSync(path.join(this.boardsDir, f), 'utf8');
            return JSON.parse(content);
        });
    }
    async addTask(title, options = {}) {
        const board = this.currentBoard || (await this.getDefaultBoard());
        const task = {
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
    async moveTask(taskId, newColumn) {
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
    async getTasks(column) {
        const board = this.currentBoard || (await this.getDefaultBoard());
        if (column) {
            return board.tasks.filter((t) => t.column === column);
        }
        return board.tasks;
    }
    async getAllTasks() {
        const board = this.currentBoard || (await this.getDefaultBoard());
        const tasks = { todo: [], doing: [], done: [] };
        for (const task of board.tasks) {
            tasks[task.column].push(task);
        }
        return tasks;
    }
    async deleteTask(taskId) {
        const board = this.currentBoard || (await this.getDefaultBoard());
        const index = board.tasks.findIndex((t) => t.id === taskId);
        if (index === -1) {
            throw new Error(`Task not found: ${taskId}`);
        }
        board.tasks.splice(index, 1);
        await this.saveBoard(board);
    }
    async updateTask(taskId, updates) {
        const board = this.currentBoard || (await this.getDefaultBoard());
        const task = board.tasks.find((t) => t.id === taskId);
        if (!task) {
            throw new Error(`Task not found: ${taskId}`);
        }
        Object.assign(task, updates, { updatedAt: new Date().toISOString() });
        await this.saveBoard(board);
        return task;
    }
    async getDefaultBoard() {
        const boards = await this.listBoards();
        if (boards.length > 0) {
            this.currentBoard = boards[0];
            return boards[0];
        }
        // Create default board
        return await this.createBoard('Default Board', 'Default Kanban board');
    }
}
//# sourceMappingURL=KanbanService.js.map