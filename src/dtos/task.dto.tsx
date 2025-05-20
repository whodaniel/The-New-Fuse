import { IsString, IsEnum, IsOptional, IsUUID, IsArray, IsDate, IsObject } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { TaskStatus, TaskPriority, TaskType } from '@the-new-fuse/types';

export class CreateTaskDto {
    @ApiProperty()
    title: string;

    @ApiProperty( { required: false })
    @IsString()
    description?: string;

    @ApiProperty( { enum: TaskPriority, required: false })
    @IsEnum(TaskPriority)
    priority?: TaskPriority;

    @ApiProperty( { enum: TaskType, required: false })
    @IsEnum(TaskType)
    type?: TaskType;

    @ApiProperty( { required: false })
    @Type(() => Date)
    dueDate?: Date;

    @ApiProperty( { required: false })
    @IsUUID()
    assignedTo?: string;

    @ApiProperty( { required: false })
    @IsArray()
    @IsUUID("4", { each: true })
    @IsOptional()
    dependencies?: string[];

    @ApiProperty( { required: false })
    @IsObject()
    metadata?: Record<string, any>;

    @ApiProperty( { required: false })
    @IsArray()
    @IsString({ each: true })
    @IsOptional()
    tags?: string[];
}

export class UpdateTaskDto {
    @ApiProperty({ required: false })
    title?: string;

    @ApiProperty( { required: false })
    @IsString()
    description?: string;

    @ApiProperty( { enum: TaskStatus, required: false })
    @IsEnum(TaskStatus)
    status?: TaskStatus;

    @ApiProperty( { enum: TaskPriority, required: false })
    @IsEnum(TaskPriority)
    priority?: TaskPriority;

    @ApiProperty( { enum: TaskType, required: false })
    @IsEnum(TaskType)
    type?: TaskType;

    @ApiProperty( { required: false })
    @Type(() => Date)
    dueDate?: Date | null;

    @ApiProperty( { required: false })
    @IsUUID()
    assignedTo?: string | null;

    @ApiProperty( { required: false })
    @Type(() => Date)
    completedAt?: Date | null;
}

export class TaskResponseDto {
    @ApiProperty()
    id: string;

    @ApiProperty()
    title: string;

    @ApiProperty( { required: false })
    description?: string;

    @ApiProperty({ enum: TaskStatus })
    status: TaskStatus;

    @ApiProperty( { enum: TaskPriority })
    priority: TaskPriority;

    @ApiProperty({ enum: TaskType })
    type: TaskType;

    @ApiProperty( { required: false })
    dueDate?: Date;

    @ApiProperty({ required: false })
    assignedTo?: string;

    @ApiProperty( { type: [String] })
    dependencies: string[];

    @ApiProperty()
    createdAt: Date;

    @ApiProperty()
    updatedAt: Date;

    @ApiProperty( { required: false })
    completedAt?: Date;
}