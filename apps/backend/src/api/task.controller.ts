import {
  Body,
  Controller,
  Delete,
  Get,
  HttpException,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { ApiBody, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { db, tasks } from '@the-new-fuse/database';
import { eq } from 'drizzle-orm';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { v4 as uuidv4 } from 'uuid';

export enum TaskStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export enum TaskPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

export class CreateTaskDto {
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsString()
  type: string;

  @IsOptional()
  @IsEnum(TaskStatus)
  status?: TaskStatus;

  @IsOptional()
  @IsEnum(TaskPriority)
  priority?: TaskPriority;

  @IsString()
  userId: string;

  @IsOptional()
  @IsString()
  assignedToId?: string;
}

@ApiTags('Tasks')
@Controller('tasks')
export class TaskController {
  constructor() {}

  @Post()
  @ApiOperation({ summary: 'Create a new task' })
  @ApiBody({ type: CreateTaskDto })
  async createTask(@Body() data: CreateTaskDto): Promise<any> {
    const id = uuidv4();
    const newTask = {
      id,
      title: data.title,
      description: data.description,
      type: data.type,
      status: data.status || TaskStatus.PENDING,
      priority: data.priority || TaskPriority.MEDIUM,
      userId: data.userId,
      assignedToId: data.assignedToId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await db.insert(tasks).values(newTask as any);
    return newTask;
  }

  @Get()
  @ApiOperation({ summary: 'List all tasks' })
  async getTasks(@Query('userId') userId?: string): Promise<any[]> {
    if (userId) {
      return db.select().from(tasks).where(eq(tasks.userId, userId as any));
    }
    return db.select().from(tasks);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get task by ID' })
  @ApiParam({ name: 'id', description: 'Task ID' })
  async getTaskById(@Param('id') id: string): Promise<any> {
    const result = await db.select().from(tasks).where(eq(tasks.id, id as any));
    if (result.length === 0) {
      throw new HttpException('Task not found', HttpStatus.NOT_FOUND);
    }
    return result[0];
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update task' })
  async updateTask(@Param('id') id: string, @Body() updates: any): Promise<any> {
    await db
      .update(tasks)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(tasks.id, id as any));
    return this.getTaskById(id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete task' })
  async deleteTask(@Param('id') id: string): Promise<any> {
    await db.delete(tasks).where(eq(tasks.id, id as any));
    return { message: 'Task deleted successfully' };
  }
}
