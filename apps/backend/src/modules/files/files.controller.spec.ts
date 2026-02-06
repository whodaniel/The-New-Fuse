import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { FileCategory } from './dto/file.dto';
import { FilesController } from './files.controller';
import { FilesService } from './files.service';

describe('FilesController', () => {
  let controller: FilesController;
  let service: FilesService;

  const mockFilesService = {
    uploadFile: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    delete: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FilesController],
      providers: [
        {
          provide: FilesService,
          useValue: mockFilesService,
        },
      ],
    }).compile();

    controller = module.get<FilesController>(FilesController);
    service = module.get<FilesService>(FilesService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('uploadFile', () => {
    it('should upload a file successfully', async () => {
      const mockFile = {
        originalname: 'test.pdf',
        mimetype: 'application/pdf',
        size: 1024000,
        buffer: Buffer.from('test'),
      } as Express.Multer.File;

      const mockResponse = {
        id: 'file_001',
        filename: 'test.pdf',
        mimeType: 'application/pdf',
        size: 1024000,
        category: FileCategory.DOCUMENT,
        url: 'https://storage.example.com/files/file_001',
        uploadedBy: 'usr_123',
        uploadedAt: new Date(),
      };

      mockFilesService.uploadFile.mockResolvedValue(mockResponse);

      const req = { user: { id: 'usr_123' } };
      const result = await controller.uploadFile(mockFile, req);

      expect(result).toEqual(mockResponse);
      expect(service.uploadFile).toHaveBeenCalledWith(mockFile, 'usr_123');
    });

    it('should throw error if no file provided', async () => {
      const req = { user: { id: 'usr_123' } };

      await expect(controller.uploadFile(null as any, req)).rejects.toThrow(BadRequestException);
      await expect(controller.uploadFile(null as any, req)).rejects.toThrow('No file provided');
    });

    it('should throw error if file size exceeds limit', async () => {
      const mockFile = {
        originalname: 'large.pdf',
        mimetype: 'application/pdf',
        size: 15 * 1024 * 1024, // 15MB
        buffer: Buffer.from('test'),
      } as Express.Multer.File;

      const req = { user: { id: 'usr_123' } };

      await expect(controller.uploadFile(mockFile, req)).rejects.toThrow(BadRequestException);
      await expect(controller.uploadFile(mockFile, req)).rejects.toThrow(
        'File size exceeds 10MB limit'
      );
    });
  });

  describe('findAll', () => {
    it('should return paginated file list', async () => {
      const query = { page: 1, limit: 20 };
      const mockResponse = {
        files: [
          {
            id: 'file_001',
            filename: 'test.pdf',
            mimeType: 'application/pdf',
            size: 1024000,
            category: FileCategory.DOCUMENT,
            url: 'https://storage.example.com/files/file_001',
            uploadedBy: 'usr_123',
            uploadedAt: new Date(),
          },
        ],
        pagination: {
          total: 1,
          page: 1,
          limit: 20,
          totalPages: 1,
        },
      };

      mockFilesService.findAll.mockResolvedValue(mockResponse);

      const req = { user: { id: 'usr_123' } };
      const result = await controller.findAll(query, req);

      expect(result).toEqual(mockResponse);
      expect(service.findAll).toHaveBeenCalledWith(query, 'usr_123');
    });
  });

  describe('downloadFile', () => {
    it('should return file metadata for download', async () => {
      const fileId = 'file_001';
      const mockFile = {
        id: fileId,
        filename: 'test.pdf',
        mimeType: 'application/pdf',
        size: 1024000,
        category: FileCategory.DOCUMENT,
        url: 'https://storage.example.com/files/file_001',
        uploadedBy: 'usr_123',
        uploadedAt: new Date(),
      };

      mockFilesService.findOne.mockResolvedValue(mockFile);

      const req = { user: { id: 'usr_123' } };
      const result = await controller.downloadFile(fileId, req);

      expect(result).toEqual(mockFile);
      expect(service.findOne).toHaveBeenCalledWith(fileId, 'usr_123');
    });
  });

  describe('delete', () => {
    it('should delete a file', async () => {
      const fileId = 'file_001';

      mockFilesService.delete.mockResolvedValue(undefined);

      const req = { user: { id: 'usr_123' } };
      await controller.delete(fileId, req);

      expect(service.delete).toHaveBeenCalledWith(fileId, 'usr_123');
      expect(service.delete).toHaveBeenCalledTimes(1);
    });
  });
});
