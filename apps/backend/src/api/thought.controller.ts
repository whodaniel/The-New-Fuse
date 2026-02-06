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
import { db, schema } from '@the-new-fuse/database';
import { eq, desc } from 'drizzle-orm';
import { IsOptional, IsString, IsNumber, IsArray } from 'class-validator';
import { v4 as uuidv4 } from 'uuid';

const { thoughts } = schema;

export class CreateThoughtDto {
  @IsString()
  content: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsString()
  userId: string;
}

@ApiTags('Thoughts')
@Controller('thoughts')
export class ThoughtController {
  constructor() {}

  @Post()
  @ApiOperation({ summary: 'Capture a random thought' })
  @ApiBody({ type: CreateThoughtDto })
  async createThought(@Body() data: CreateThoughtDto): Promise<any> {
    const id = uuidv4();
    
    // AI assessment logic placeholder
    const relevanceScore = 0.5; // Default neutral relevance
    const tags = data.tags || [];
    const category = data.category || 'uncategorized';

    const newThought = {
      id,
      content: data.content,
      category,
      tags,
      relevanceScore,
      userId: data.userId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await db.insert(thoughts).values(newThought as any);

    return newThought;
  }

  @Get()
  @ApiOperation({ summary: 'List captured thoughts' })
  async getThoughts(@Query('userId') userId?: string): Promise<any[]> {
    if (userId) {
      return db.select().from(thoughts).where(eq(thoughts.userId, userId as any)).orderBy(desc(thoughts.createdAt));
    }
    return db.select().from(thoughts).orderBy(desc(thoughts.createdAt));
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get thought by ID' })
  @ApiParam({ name: 'id', description: 'Thought ID' })
  async getThoughtById(@Param('id') id: string): Promise<any> {
    const result = await db.select().from(thoughts).where(eq(thoughts.id, id as any));
    if (result.length === 0) {
      throw new HttpException('Thought not found', HttpStatus.NOT_FOUND);
    }
    return result[0];
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete thought' })
  async deleteThought(@Param('id') id: string): Promise<any> {
    await db.delete(thoughts).where(eq(thoughts.id, id as any));
    return { message: 'Thought deleted successfully' };
  }
}
