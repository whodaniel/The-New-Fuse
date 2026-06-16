import fs from 'fs';
import path from 'path';

export interface DirectiveRecord {
  id: string;
  directive: string;
  source: string;
  status: 'pending' | 'claimed' | 'completed' | 'cancelled';
  claimedBy?: string;
  claimedAt?: string;
  completedAt?: string;
  createdAt: string;
}

export class DirectiveConversionService {
  private ledgerPath: string;

  constructor(private repoRoot: string) {
    this.ledgerPath = path.join(repoRoot, '.tnf', 'assimilated-directives.jsonl');
  }

  public list(status?: DirectiveRecord['status']): DirectiveRecord[] {
    if (!fs.existsSync(this.ledgerPath)) return [];
    const records: DirectiveRecord[] = [];
    const lines = fs.readFileSync(this.ledgerPath, 'utf8').split('\n').filter(Boolean);
    for (const line of lines) {
      try {
        const record = JSON.parse(line) as DirectiveRecord;
        if (!status || record.status === status) {
          records.push(record);
        }
      } catch {
        continue;
      }
    }
    return records;
  }

  public claim(id: string, claimedBy: string): DirectiveRecord | null {
    const records = this.list();
    const idx = records.findIndex((r) => r.id === id);
    if (idx === -1) return null;
    if (records[idx].status !== 'pending') return null;

    records[idx].status = 'claimed';
    records[idx].claimedBy = claimedBy;
    records[idx].claimedAt = new Date().toISOString();
    this._writeAll(records);
    return records[idx];
  }

  public complete(id: string): DirectiveRecord | null {
    const records = this.list();
    const idx = records.findIndex((r) => r.id === id);
    if (idx === -1) return null;

    records[idx].status = 'completed';
    records[idx].completedAt = new Date().toISOString();
    this._writeAll(records);
    return records[idx];
  }

  public getSummary(): { pending: number; claimed: number; completed: number; cancelled: number } {
    const records = this.list();
    return {
      pending: records.filter((r) => r.status === 'pending').length,
      claimed: records.filter((r) => r.status === 'claimed').length,
      completed: records.filter((r) => r.status === 'completed').length,
      cancelled: records.filter((r) => r.status === 'cancelled').length,
    };
  }

  private _writeAll(records: DirectiveRecord[]): void {
    fs.mkdirSync(path.dirname(this.ledgerPath), { recursive: true });
    const lines = records.map((r) => JSON.stringify(r)).join('\n');
    fs.writeFileSync(this.ledgerPath, lines + '\n', 'utf8');
  }
}
