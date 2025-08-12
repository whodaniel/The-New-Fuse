import { Controller, Get, Post, Put, Patch, Delete, Param, Body, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiParam, ApiBody } from '@nestjs/swagger';
import { TaskService } from './TaskService';
import { Task } from './entities/Task';
import { CreateTaskDto, UpdateTaskDto } from './dto/task.dto';
@Controller('tasks')
export class TaskController {
  constructor(private readonly taskService: TaskService) {}

  @Get()
  @ApiOperation({ summary: 'Get all tasks' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Tasks retrieved successfully', type: [Task] })
  async findAll(): unknown {
    return this.taskService.findAll();
  }

  @Get('statistics')
  @ApiOperation({ summary: 'Get task statistics' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Task statistics retrieved successfully' })
  async getStatistics(): unknown {
    return this.taskService.getStatistics();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a task by ID' })
  @ApiParam({ name: 'id', description: 'The ID of the task to retrieve' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Task retrieved successfully', type: Task })
  async findOne(): unknown {
    return this.taskService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new task' })
  @ApiBody({ type: CreateTaskDto })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Task created successfully', type: Task })
  async create(): unknown {
    return this.taskService.create(createTaskDto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a task' })
  @ApiParam({ name: 'id', description: 'The ID of the task to update' })
  @ApiBody({ type: UpdateTaskDto })
  @ApiResponse({ status: HttpStatus.OK, description: 'Task updated successfully', type: Task })
  async update(): unknown {
    return this.taskService.update(id, updateTaskDto);
  }

  @Patch(':id/assign')
  @ApiOperation({ summary: 'Assign a task to a user' })
  @ApiParam({ name: 'id', description: 'The ID of the task to assign' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Task assigned successfully', type: Task })
  async assign(): unknown {
    return this.taskService.assign(id, userId);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update task status' })
  @ApiParam({ name: 'id', description: 'The ID of the task to update status' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Task status updated successfully', type: Task })
  async updateStatus(): unknown {
    return this.taskService.updateStatus(id, status);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a task' })
  @ApiParam({ name: 'id', description: 'The ID of the task to delete' })
  @ApiResponse({ status: HttpStatus.NO_CONTENT, description: 'Task successfully deleted' })
  async remove(): unknown {
    return this.taskService.remove(id);
  }
}