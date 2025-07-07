"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TaskService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const Task_1 = require("../../entities/Task");
const TaskExecution_1 = require("../../entities/TaskExecution");
let TaskService = class TaskService {
    taskRepository;
    taskExecutionRepository;
    constructor(taskRepository, taskExecutionRepository) {
        this.taskRepository = taskRepository;
        this.taskExecutionRepository = taskExecutionRepository;
    }
    async findStuckTasks() {
        // Using LessThan from typeorm for proper comparison
        return this.taskRepository.find({
            where: {
                status: 'RUNNING',
                startTime: new Date(Date.now() - 30 * 60 * 1000) // Use Raw or custom query for <
            }
        });
    }
    async updateTask(taskId, updates) {
        await this.taskRepository.update(taskId, updates);
        return this.taskRepository.findOne({ where: { id: taskId } });
    }
    async getTaskById(taskId) {
        return this.taskRepository.findOne({ where: { id: taskId } });
    }
    async createTask(data) {
        const task = this.taskRepository.create(data);
        return this.taskRepository.save(task);
    }
    async getPendingTasks() {
        return this.taskRepository.find({
            where: {
                status: 'PENDING'
            },
            order: {
                priority: 'DESC'
            }
        });
    }
    async getTaskExecutions(taskId) {
        return this.taskExecutionRepository.find({
            where: {
                taskId
            },
            order: {
                createdAt: 'DESC'
            }
        });
    }
    async deleteTasks(pipelineId) {
        await this.taskRepository.delete({ pipelineId });
    }
    async deleteTaskExecutions(taskId) {
        await this.taskExecutionRepository.delete({ taskId });
    }
};
exports.TaskService = TaskService;
exports.TaskService = TaskService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(Task_1.Task)),
    __param(1, (0, typeorm_1.InjectRepository)(TaskExecution_1.TaskExecution)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository])
], TaskService);
