import { IsString, IsOptional, IsObject, IsArray, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class MemoryContentDto {
    @ApiProperty()
    content: string;

    @ApiProperty( { required: false })
    @IsObject()
    metadata?: Record<string, any>;

    @ApiProperty( { required: false })
    @IsArray()
    @IsString({ each: true })
    @IsOptional()
    tags?: string[];
}

export class MemoryQueryDto {
    @ApiProperty()
    query: string;

    @ApiProperty( { required: false })
    @IsNumber()
    limit?: number;

    @ApiProperty( { required: false })
    @IsNumber()
    threshold?: number;

    @ApiProperty( { required: false })
    @IsArray()
    @IsString({ each: true })
    @IsOptional()
    tags?: string[];
}

export class MemoryResponseDto {
    @ApiProperty()
    id: string;

    @ApiProperty()
    content: string;

    @ApiProperty( { required: false })
    metadata?: Record<string, any>;

    @ApiProperty({ type: [String] })
    tags: string[];

    @ApiProperty()
    createdAt: Date;

    @ApiProperty( { required: false })
    @IsNumber()
    @IsOptional()
    relevanceScore?: number;
}