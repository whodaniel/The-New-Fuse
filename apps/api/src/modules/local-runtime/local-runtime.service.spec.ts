import { LocalRuntimeService } from './local-runtime.service';

describe('LocalRuntimeService', () => {
  let service: LocalRuntimeService;

  beforeEach(() => {
    service = new LocalRuntimeService();
  });

  describe('parseCrontab', () => {
    const now = new Date('2026-07-25T12:00:30Z');

    it('parses a standard 5-field entry', () => {
      const jobs = service.parseCrontab('*/5 * * * * node /x/tnf-director-loop.cjs', now);
      expect(jobs).toHaveLength(1);
      expect(jobs[0].schedule).toBe('*/5 * * * *');
      expect(jobs[0].command).toContain('tnf-director-loop.cjs');
      expect(jobs[0].label).toBe('tnf-director-loop');
      expect(jobs[0].scheduleHuman).toBe('every 5 minutes');
      expect(jobs[0].nextRunAt).toBeTruthy();
    });

    it('skips comments, blank lines, and env assignments', () => {
      const text = [
        '# a comment',
        '',
        'SHELL=/bin/zsh',
        'PATH=/usr/bin:/bin',
        '0 9 * * * echo hello',
      ].join('\n');
      const jobs = service.parseCrontab(text, now);
      expect(jobs).toHaveLength(1);
      expect(jobs[0].scheduleHuman).toBe('daily at 09:00');
    });

    it('derives label from trailing provenance comment', () => {
      const jobs = service.parseCrontab(
        '*/15 * * * * cd /repo && node run.cjs --process-id "tnf-master-clock-super-cycle" >> log 2>&1 # tnf-chronological:tnf-master-clock-super-cycle',
        now
      );
      expect(jobs[0].label).toBe('tnf-master-clock-super-cycle');
    });

    it('derives label from --process-id when no comment tag exists', () => {
      const jobs = service.parseCrontab(
        '0 */6 * * * node run.cjs --process-id "tnf-self-improvement-scorecard"',
        now
      );
      expect(jobs[0].label).toBe('tnf-self-improvement-scorecard');
    });

    it('ignores malformed schedule lines', () => {
      const jobs = service.parseCrontab('not a cron line at all here now', now);
      expect(jobs).toHaveLength(0);
    });
  });

  describe('nextRunAt', () => {
    it('computes next fire for */5 minutes', () => {
      const next = service.nextRunAt('*/5 * * * *', new Date('2026-07-25T12:01:00Z'));
      expect(next).toBeTruthy();
      const minutes = new Date(next as string).getMinutes();
      expect(minutes % 5).toBe(0);
    });

    it('computes next fire for a daily job that already ran today', () => {
      const from = new Date('2026-07-25T10:00:00');
      const next = service.nextRunAt('0 9 * * *', from);
      expect(next).toBeTruthy();
      const nextDate = new Date(next as string);
      expect(nextDate.getTime()).toBeGreaterThan(from.getTime());
      expect(nextDate.getHours()).toBe(9);
      expect(nextDate.getMinutes()).toBe(0);
    });

    it('treats dow 7 as Sunday', () => {
      const next = service.nextRunAt('0 0 * * 7', new Date('2026-07-25T12:00:00'));
      expect(next).toBeTruthy();
      expect(new Date(next as string).getDay()).toBe(0);
    });

    it('returns null for invalid fields', () => {
      expect(service.nextRunAt('61 * * * *', new Date())).toBeNull();
      expect(service.nextRunAt('* * *', new Date())).toBeNull();
    });
  });

  describe('humanizeSchedule', () => {
    it.each([
      ['*/1 * * * *', 'every 1 minutes'],
      ['* * * * *', 'every minute'],
      ['30 3 * * *', 'daily at 03:30'],
      ['15 */2 * * *', 'every 2 hours at :15'],
      ['5 * * * *', 'hourly at :05'],
      ['0 9 * * 1', 'every Monday at 09:00'],
      ['1 2 3 4 5', '1 2 3 4 5'],
    ])('%s -> %s', (schedule, expected) => {
      expect(service.humanizeSchedule(schedule)).toBe(expected);
    });
  });

  describe('getGoals / getTerminalMirror fallbacks', () => {
    it('returns available:false when goals dir is missing', async () => {
      process.env.TNF_GOALS_DIR = '/nonexistent-tnf-test-dir';
      try {
        const result = await service.getGoals();
        expect(result.available).toBe(false);
      } finally {
        delete process.env.TNF_GOALS_DIR;
      }
    });

    it('returns available:false when heartbeat state is missing', async () => {
      process.env.TNF_TERMINAL_HEARTBEAT_STATE_PATH = '/nonexistent-tnf-test-state.json';
      try {
        const result = await service.getTerminalMirror();
        expect(result.available).toBe(false);
      } finally {
        delete process.env.TNF_TERMINAL_HEARTBEAT_STATE_PATH;
      }
    });
  });
});
