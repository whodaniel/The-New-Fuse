import {
  BadRequestException,
  Controller,
  Delete,
  Get,
  Header,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard.js';
import { FileListQueryDto, FileListResponseDto, FileUploadResponseDto } from './dto/file.dto.js';
import { FilesService } from './files.service.js';

@ApiTags('files')
@Controller('files')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({
    summary: 'Upload a file',
    description: 'Upload a file to the server. Maximum file size: 10MB',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'File to upload',
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'File uploaded successfully',
    type: FileUploadResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid file or file too large' })
  async uploadFile(@UploadedFile() file: any, @Req() req: any): Promise<FileUploadResponseDto> {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    // Validate file size (10MB limit)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      throw new BadRequestException('File size exceeds 10MB limit');
    }

    const userId = req.user?.id || 'usr_default';
    return this.filesService.uploadFile(file, userId);
  }

  @Get()
  @ApiOperation({
    summary: 'Get user files',
    description: 'Retrieve a paginated list of files uploaded by the current user',
  })
  @ApiResponse({
    status: 200,
    description: 'Files retrieved successfully',
    type: FileListResponseDto,
  })
  async findAll(@Query() query: FileListQueryDto, @Req() req: any): Promise<FileListResponseDto> {
    const userId = req.user?.id || 'usr_default';
    return this.filesService.findAll(query, userId);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Download a file',
    description: 'Download a specific file by its ID',
  })
  @Header('Content-Type', 'application/octet-stream')
  @ApiResponse({
    status: 200,
    description: 'File downloaded successfully',
  })
  @ApiResponse({ status: 404, description: 'File not found' })
  async downloadFile(@Param('id') id: string, @Req() req: any): Promise<FileUploadResponseDto> {
    const userId = req.user?.id || 'usr_default';
    // Return file metadata for now - in production, return StreamableFile
    return this.filesService.findOne(id, userId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete a file',
    description: 'Delete a file by its ID',
  })
  @ApiResponse({ status: 204, description: 'File deleted successfully' })
  @ApiResponse({ status: 404, description: 'File not found' })
  async delete(@Param('id') id: string, @Req() req: any): Promise<void> {
    const userId = req.user?.id || 'usr_default';
    return this.filesService.delete(id, userId);
  }
}
