import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { FileUploadResponseDto, FileCategory, FileListQueryDto, FileListResponseDto } from './dto/file.dto';

@Injectable()
export class FilesService {
  private readonly logger = new Logger(FilesService.name);
  private files: Map<string, FileUploadResponseDto> = new Map();

  constructor() {
    this.initializeMockFiles();
  }

  private initializeMockFiles() {
    const mockFiles: FileUploadResponseDto[] = [
      {
        id: 'file_001',
        filename: 'project-proposal.pdf',
        mimeType: 'application/pdf',
        size: 2048000,
        category: FileCategory.DOCUMENT,
        url: 'https://storage.example.com/files/file_001',
        uploadedBy: 'usr_123',
        uploadedAt: new Date('2024-01-15T10:00:00Z'),
        metadata: { pages: 25 }
      },
      {
        id: 'file_002',
        filename: 'avatar.png',
        mimeType: 'image/png',
        size: 512000,
        category: FileCategory.IMAGE,
        url: 'https://storage.example.com/files/file_002',
        uploadedBy: 'usr_123',
        uploadedAt: new Date('2024-01-16T11:30:00Z'),
        metadata: { width: 500, height: 500 }
      }
    ];

    mockFiles.forEach(file => this.files.set(file.id, file));
  }

  async uploadFile(
    file: Express.Multer.File,
    userId: string,
    metadata?: Record<string, any>
  ): Promise<FileUploadResponseDto> {
    this.logger.log(`Uploading file: ${file.originalname} for user ${userId}`);

    const fileId = `file_${Date.now()}`;
    const category = this.determineCategory(file.mimetype);

    const uploadedFile: FileUploadResponseDto = {
      id: fileId,
      filename: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      category,
      url: `https://storage.example.com/files/${fileId}`,
      uploadedBy: userId,
      uploadedAt: new Date(),
      metadata
    };

    this.files.set(fileId, uploadedFile);
    this.logger.log(`File uploaded successfully: ${fileId}`);

    return uploadedFile;
  }

  async findAll(query: FileListQueryDto, userId: string): Promise<FileListResponseDto> {
    const { category, page = 1, limit = 20 } = query;

    this.logger.log(`Fetching files for user ${userId}`);

    let fileList = Array.from(this.files.values());

    // Filter by user
    fileList = fileList.filter(file => file.uploadedBy === userId);

    // Filter by category
    if (category) {
      fileList = fileList.filter(file => file.category === category);
    }

    const total = fileList.length;
    const totalPages = Math.ceil(total / limit);
    const skip = (page - 1) * limit;
    const files = fileList.slice(skip, skip + limit);

    return {
      files,
      pagination: {
        total,
        page,
        limit,
        totalPages
      }
    };
  }

  async findOne(id: string, userId: string): Promise<FileUploadResponseDto> {
    this.logger.log(`Fetching file: ${id}`);

    const file = this.files.get(id);

    if (!file) {
      throw new NotFoundException(`File with ID ${id} not found`);
    }

    // Verify user has access to the file
    if (file.uploadedBy !== userId) {
      throw new NotFoundException(`File with ID ${id} not found`);
    }

    return file;
  }

  async delete(id: string, userId: string): Promise<void> {
    this.logger.log(`Deleting file: ${id}`);

    const file = this.files.get(id);

    if (!file) {
      throw new NotFoundException(`File with ID ${id} not found`);
    }

    if (file.uploadedBy !== userId) {
      throw new NotFoundException(`File with ID ${id} not found`);
    }

    this.files.delete(id);
    this.logger.log(`File deleted successfully: ${id}`);
  }

  private determineCategory(mimeType: string): FileCategory {
    if (mimeType.startsWith('image/')) return FileCategory.IMAGE;
    if (mimeType.startsWith('video/')) return FileCategory.VIDEO;
    if (mimeType.startsWith('audio/')) return FileCategory.AUDIO;
    if (mimeType.includes('pdf') || mimeType.includes('document') || mimeType.includes('text')) {
      return FileCategory.DOCUMENT;
    }
    if (mimeType.includes('zip') || mimeType.includes('tar') || mimeType.includes('rar')) {
      return FileCategory.ARCHIVE;
    }
    return FileCategory.OTHER;
  }
}
