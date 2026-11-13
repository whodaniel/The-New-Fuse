/**
 * Per-user Personal Intelligence cloud store (file-backed).
 * Path: {TNF_PERSONAL_INTEL_CLOUD_ROOT|TNF_HOME/cloud-personal-intelligence}/<userId>/index.json
 */
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { EMPTY_UNIFIED, type UnifiedPersonalIntelPayload } from './personal-intelligence.types';

function cloudPersonalIntelRoot(): string {
  return (
    process.env.TNF_PERSONAL_INTEL_CLOUD_ROOT ||
    path.join(
      process.env.TNF_HOME || path.join(os.homedir(), '.tnf'),
      'cloud-personal-intelligence'
    )
  );
}

function sanitizeUserId(userId: string): string {
  return userId.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 128) || 'anonymous';
}

export class PersonalIntelligenceStore {
  private readonly root: string;
  private readonly indexPath: string;

  constructor(userId: string) {
    this.root = path.join(cloudPersonalIntelRoot(), sanitizeUserId(userId));
    this.indexPath = path.join(this.root, 'index.json');
    fs.mkdirSync(this.root, { recursive: true });
  }

  get(): UnifiedPersonalIntelPayload {
    if (!fs.existsSync(this.indexPath)) {
      return { ...EMPTY_UNIFIED };
    }
    try {
      const parsed = JSON.parse(
        fs.readFileSync(this.indexPath, 'utf8')
      ) as UnifiedPersonalIntelPayload;
      if (!parsed || typeof parsed !== 'object') return { ...EMPTY_UNIFIED };
      return {
        generatedAt: String(parsed.generatedAt || ''),
        totalItems: Number(parsed.totalItems || (parsed.items?.length ?? 0)),
        sources: Array.isArray(parsed.sources) ? parsed.sources : [],
        items: Array.isArray(parsed.items) ? parsed.items : [],
        updatedAt: parsed.updatedAt,
        ownerUserId: parsed.ownerUserId,
      };
    } catch {
      return { ...EMPTY_UNIFIED };
    }
  }

  put(payload: UnifiedPersonalIntelPayload): UnifiedPersonalIntelPayload {
    const tmp = `${this.indexPath}.${process.pid}.tmp`;
    fs.writeFileSync(tmp, JSON.stringify(payload, null, 2));
    fs.renameSync(tmp, this.indexPath);
    return payload;
  }

  clear(): void {
    if (fs.existsSync(this.indexPath)) {
      fs.unlinkSync(this.indexPath);
    }
  }
}
