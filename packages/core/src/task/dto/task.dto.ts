import { IsString, IsOptional, IsEnum, IsArray, IsDateString, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { TaskStatus, TaskPriority } from '../entities/Task';

export class CreateTaskDto {
  @ApiProperty({ description: 'Task title' })
  @IsString()
  title: string;

  @ApiProperty({ description: 'Task description', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Task status', enum: TaskStatus, required: false })
  @IsOptional()
  @IsEnum(TaskStatus)
  status?: TaskStatus;

  @ApiProperty({ description: 'Task priority', enum: TaskPriority, required: false })
  @IsOptional()
  @IsEnum(TaskPriority)
  priority?: TaskPriority;

  @ApiProperty({ description: 'Task tags', type: [String], required: false })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiProperty({ description: 'Due date', required: false })
  @IsOptional()
  @IsDateString()
  dueDate?: Date;

  @ApiProperty({ description: 'Assigned user ID', required: false })
  @IsOptional()
  @IsUUID()
  assignedTo?: string;

  @ApiProperty({ description: 'Workspace ID', required: false })
  @IsOptional()
  @IsUUID()
  workspaceId?: string;

  @ApiProperty({ description: 'Additional metadata', required: false })
  @IsOptional()
  metadata?: Record<string, any>;

  @ApiProperty({ description: 'Task dependencies', type: [String], required: false })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  dependencies?: string[];
}

export class UpdateTaskDto {
  @ApiProperty({ description: 'Task title', required: false })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiProperty({ description: 'Task description', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Task status', enum: TaskStatus, required: false })
  @IsOptional()
  @IsEnum(TaskStatus)
  status?: TaskStatus;

  @ApiProperty({ description: 'Task priority', enum: TaskPriority, required: false })
  @IsOptional()
  @IsEnum(TaskPriority)
  priority?: TaskPriority;

  @ApiProperty({ description: 'Task tags', type: [String], required: false })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiProperty({ description: 'Due date', required: false })
  @IsOptional()
  @IsDateString()
  dueDate?: Date;

  @ApiProperty({ description: 'Assigned user ID', required: false })
  @IsOptional()
  @IsUUID()
  assignedTo?: string;

  @ApiProperty({ description: 'Additional metadata', required: false })
  @IsOptional()
  metadata?: Record<string, any>;

  @ApiProperty({ description: 'Task dependencies', type: [String], required: false })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  dependencies?: string[];
}