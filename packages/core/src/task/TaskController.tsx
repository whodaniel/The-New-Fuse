import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, HttpStatus, Patch } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { TaskManager } from './TaskManager.js';
import { CreateTaskDto, UpdateTaskDto, TaskFilterDto } from './dto/task.dto.js';
import { Task } from './entities/Task.js';
import { AuthGuard } from '../auth/guards/auth.guard.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { User } from '../user/entities/User.js';
import { TaskStatistics } from './interfaces/task.interface.js';

@ApiTags('Tasks')
@Controller('tasks')
@UseGuards(AuthGuard)
@ApiBearerAuth()
export class TaskController {
  constructor(private readonly taskManager: TaskManager) {}

  @Post()
  @ApiOperation({ summary: 'Create a new task' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'The task has been successfully created.', type: Task })
  create(
    @Body() createTaskDto: CreateTaskDto,
    @CurrentUser() user: User
  ): Promise<Task> {
    return this.taskManager.createTask({ ...createTaskDto, creatorId: user.id });
  }

  @Get()
  @ApiOperation({ summary: 'Get all tasks with filters' })
  @ApiResponse({ status: HttpStatus.OK, description: 'List of tasks matching filters.', type: [Task] })
  findAll(@Query() filterDto: TaskFilterDto): Promise<Task[]> {
    return this.taskManager.findTasks(filterDto);
  }

  @Get('statistics')
  @ApiOperation({ summary: 'Get task statistics' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Task statistics.', type: TaskStatistics })
  getStatistics(): Promise<TaskStatistics> {
    return this.taskManager.getTaskStatistics();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a task by ID' })
  @ApiParam({ name: 'id', description: 'The ID of the task to retrieve' })
  @ApiResponse({ status: HttpStatus.OK, description: 'The requested task.', type: Task })
  findOne(@Param('id') id: string): Promise<Task> {
    return this.taskManager.findTaskById(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a task' })
  @ApiParam({ name: 'id', description: 'The ID of the task to update' })
  @ApiResponse({ status: HttpStatus.OK, description: 'The updated task.', type: Task })
  update(
    @Param('id') id: string,
    @Body() updateTaskDto: UpdateTaskDto,
    @CurrentUser() user: User
  ): Promise<Task> {
    return this.taskManager.updateTask(id, updateTaskDto);
  }

  @Patch(':id/assign')
  @ApiOperation({ summary: 'Assign a task to a user' })
  @ApiParam({ name: 'id', description: 'The ID of the task to assign' })
  @ApiResponse({ status: HttpStatus.OK, description: 'The task with the new assignee.', type: Task })
  assign(
    @Param('id') id: string,
    @Body('userId') userId: string,
    @CurrentUser() user: User
  ): Promise<Task> {
    return this.taskManager.assignTask(id, userId);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update task status' })
  @ApiParam({ name: 'id', description: 'The ID of the task to update status for' })
  @ApiResponse({ status: HttpStatus.OK, description: 'The task with the updated status.', type: Task })
  updateStatus(
    @Param('id') id: string,
    @Body('status') status: TaskStatus,
    @CurrentUser() user: User
  ): Promise<Task> {
    return this.taskManager.updateTaskStatus(id, status);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a task' })
  @ApiParam({ name: 'id', description: 'The ID of the task to delete' })
  @ApiResponse({ status: HttpStatus.NO_CONTENT, description: 'Task successfully deleted.' })
  remove(
    @Param('id') id: string,
    @CurrentUser() user: User
  ): Promise<void> {
    return this.taskManager.deleteTask(id);
  }
}
