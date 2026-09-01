import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { DatabaseService } from '@the-new-fuse/database';
import { MarketplaceService } from './marketplace.service';

jest.mock('node:child_process', () => ({
  spawn: jest.fn().mockReturnValue({
    stdout: { on: jest.fn() },
    stderr: { on: jest.fn() },
    on: jest.fn((event, callback) => {
      if (event === 'close') callback(0);
    }),
  }),
}));

describe('MarketplaceService', () => {
  let service: MarketplaceService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MarketplaceService,
        {
          provide: DatabaseService,
          useValue: {
            // Mock whatever DB methods are needed
          },
        },
      ],
    }).compile();

    service = module.get<MarketplaceService>(MarketplaceService);
    // Mock db client setup
    (service as any).dbEnabled = true;
    (service as any).dbClient = jest.fn();
    (service as any).ensureInitialized = jest.fn().mockResolvedValue(undefined);
    (service as any).upsertCrawlRun = jest.fn().mockResolvedValue(undefined);
  });

  describe('triggerResearchCrawl', () => {
    it('should throw BadRequestException if input.command is provided (Security constraint)', async () => {
      await expect(service.triggerResearchCrawl({ command: 'echo "hacked"' })).rejects.toThrow(
        BadRequestException
      );
      await expect(service.triggerResearchCrawl({ command: 'echo "hacked"' })).rejects.toThrow(
        'Dynamically specifying shell commands is disabled for security reasons.'
      );
    });

    it('should not execute crawl and return dry_run when input.dryRun is true', async () => {
      process.env.CRAWL4AI_PIPELINE_COMMAND = 'safe_command';
      const result = await service.triggerResearchCrawl({ dryRun: true });
      expect(result.status).toBe('dry_run');
      expect(result.command).toBe('safe_command');
      expect(result.message).toBe('Dry run recorded; crawl command not executed.');
    });
  });
});
