import { Injectable, Logger } from '@nestjs/common';

export interface MetadataVersion {
  version: string;
  timestamp: Date;
  metadata: Record<string, any>;
  changes?: string[];
}

@Injectable()
export class MetadataVersioning {
  private readonly logger = new Logger(MetadataVersioning.name);
  private versions: MetadataVersion[] = [];

  createVersion(metadata: Record<string, any>, changes?: string[]): MetadataVersion {
    const version: MetadataVersion = {
      version: `v${this.versions.length + 1}.0.0`,
      timestamp: new Date(),
      metadata: { ...metadata },
      changes
    };

    this.versions.push(version);
    this.logger.log(`Created metadata version: ${version.version}`);
    return version;
  }

  getVersion(version: string): MetadataVersion | undefined {
    return this.versions.find(v => v.version === version);
  }

  getLatestVersion(): MetadataVersion | undefined {
    return this.versions[this.versions.length - 1];
  }

  getAllVersions(): MetadataVersion[] {
    return [...this.versions];
  }

  compareVersions(version1: string, version2: string): number {
    const v1 = this.versions.findIndex(v => v.version === version1);
    const v2 = this.versions.findIndex(v => v.version === version2);

    if (v1 === -1 || v2 === -1) {
      throw new Error('Version not found');
    }

    return v1 - v2;
  }
}
