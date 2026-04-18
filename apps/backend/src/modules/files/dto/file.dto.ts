import { IsString, IsOptional, IsNumber, Min, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum FileCategory {
  DOCUMENT = 'DOCUMENT',
  IMAGE = 'IMAGE',
  VIDEO = 'VIDEO',
  AUDIO = 'AUDIO',
  ARCHIVE = 'ARCHIVE',
  OTHER = 'OTHER'
}

export class FileUploadResponseDto {
  @ApiProperty({
    description: 'File ID',
    example: 'file_123456'
  })
  id!: string;

  @ApiProperty({
    description: 'Original filename',
    example: 'document.pdf'
  })
  filename!: string;

  @ApiProperty({
    description: 'File MIME type',
    example: 'application/pdf'
  })
  mimeType!: string;

  @ApiProperty({
    description: 'File size in bytes',
    example: 1024000
  })
  size!: number;

  @ApiProperty({
    description: 'File category',
    enum: FileCategory,
    example: FileCategory.DOCUMENT
  })
  category!: FileCategory;

  @ApiProperty({
    description: 'File URL for download',
    example: 'https://storage.example.com/files/file_123456'
  })
  url!: string;

  @ApiProperty({
    description: 'User ID who uploaded the file',
    example: 'usr_123'
  })
  uploadedBy!: string;

  @ApiProperty({
    description: 'Upload timestamp',
    example: '2024-01-01T00:00:00.000Z'
  })
  uploadedAt!: Date;

  @ApiPropertyOptional({
    description: 'File metadata',
    example: { pages: 10, author: 'John Doe' }
  })
  metadata?: Record<string, any>;
}

export class FileListQueryDto {
  @ApiPropertyOptional({
    description: 'Filter by category',
    enum: FileCategory
  })
  @IsOptional()
  @IsEnum(FileCategory)
  category?: FileCategory;

  @ApiPropertyOptional({
    description: 'Page number',
    example: 1,
    minimum: 1
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({
    description: 'Items per page',
    example: 20,
    minimum: 1
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  limit?: number;
}

export class FileListResponseDto {
  @ApiProperty({
    type: [FileUploadResponseDto],
    description: 'List of files'
  })
  files!: FileUploadResponseDto[];

  @ApiProperty({
    description: 'Pagination metadata',
    example: {
      total: 100,
      page: 1,
      limit: 20,
      totalPages: 5
    }
  })
  pagination!: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
