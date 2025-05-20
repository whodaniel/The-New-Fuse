import { IsString, IsEnum, IsOptional, IsObject, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { AgentType, AgentStatus, AgentCapability } from '@the-new-fuse/types';

export class CreateAgentDto {
    @ApiProperty()
    @IsString()
    name: string;

    @ApiProperty({ enum: AgentType })
    @IsEnum(AgentType)
    type: AgentType;

    @ApiProperty({ required: false })
    @IsArray()
    @IsOptional()
    capabilities?: AgentCapability[];

    @ApiProperty({ required: false })
    @IsObject()
    @IsOptional()
    config?: Record<string, any>;

    @ApiProperty({ required: false })
    @IsString()
    @IsOptional()
    description?: string;

    @ApiProperty({ required: false })
    @IsObject()
    @IsOptional()
    metadata?: Record<string, any>;
}

export class UpdateAgentDto {
    @ApiProperty({ required: false })
    @IsString()
    @IsOptional()
    name?: string;

    @ApiProperty({ required: false, enum: AgentType })
    @IsEnum(AgentType)
    @IsOptional()
    type?: AgentType;

    @ApiProperty({ required: false })
    @IsArray()
    @IsOptional()
    capabilities?: AgentCapability[];

    @ApiProperty({ required: false })
    @IsObject()
    @IsOptional()
    config?: Record<string, any>;

    @ApiProperty({ required: false })
    @IsString()
    @IsOptional()
    description?: string;

    @ApiProperty({ required: false, enum: AgentStatus })
    @IsEnum(AgentStatus)
    @IsOptional()
    status?: AgentStatus;
}

export class AgentResponseDto {
    @ApiProperty()
    id: string;

    @ApiProperty()
    name: string;

    @ApiProperty({ enum: AgentType })
    type: AgentType;

    @ApiProperty({ enum: AgentStatus })
    status: AgentStatus;

    @ApiProperty({ type: [String] })
    capabilities: AgentCapability[];

    @ApiProperty({ required: false })
    description?: string;

    @ApiProperty()
    createdAt: Date;

    @ApiProperty()
    updatedAt: Date;
}
