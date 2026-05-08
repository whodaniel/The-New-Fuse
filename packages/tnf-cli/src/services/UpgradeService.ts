import { spawnSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

export interface UpgradeOptions {
  target?: string;
  method?: 'curl' | 'npm' | 'pnpm' | 'bun' | 'brew';
}

export interface UpgradeResult {
  success: boolean;
  previousVersion?: string;
  newVersion?: string;
  message: string;
}

const VERSION_MANIFEST_URL = 'https://releases.thenewfuse.com/tnf-cli/versions.json';

export class UpgradeService {
  private configDir: string;

  constructor() {
    this.configDir = path.join(os.homedir(), '.config', 'tnf');
  }

  getCurrentVersion(): string {
    const packageJsonPath = path.join(__dirname, '..', 'package.json');
    try {
      const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      return pkg.version || '1.0.0';
    } catch {
      return '1.0.0';
    }
  }

  async getLatestVersion(): Promise<string> {
    try {
      const response = await fetch(VERSION_MANIFEST_URL);
      if (!response.ok) return '1.0.0';
      const data = await response.json() as { latest?: string };
      return data.latest || '1.0.0';
    } catch {
      return this.getCurrentVersion();
    }
  }

  async getAvailableVersions(): Promise<string[]> {
    try {
      const response = await fetch(VERSION_MANIFEST_URL);
      if (!response.ok) return [this.getCurrentVersion()];
      const data = await response.json() as { versions?: string[] };
      return data.versions || [this.getCurrentVersion()];
    } catch {
      return [this.getCurrentVersion()];
    }
  }

  async upgrade(options: UpgradeOptions = {}): Promise<UpgradeResult> {
    const currentVersion = this.getCurrentVersion();
    const targetVersion = options.target || await this.getLatestVersion();

    if (targetVersion === currentVersion) {
      return {
        success: true,
        previousVersion: currentVersion,
        newVersion: currentVersion,
        message: `Already at version ${currentVersion}`,
      };
    }

    const method = options.method || this.detectInstallMethod();

    switch (method) {
      case 'npm':
        return this.upgradeViaNpm(targetVersion);
      case 'pnpm':
        return this.upgradeViaPnpm(targetVersion);
      case 'bun':
        return this.upgradeViaBun(targetVersion);
      case 'brew':
        return this.upgradeViaBrew(targetVersion);
      case 'curl':
      default:
        return this.upgradeViaCurl(targetVersion);
    }
  }

  private detectInstallMethod(): UpgradeOptions['method'] {
    if (this.isInstalledViaBrew()) return 'brew';
    if (this.isInstalledViaPnpm()) return 'pnpm';
    if (this.isInstalledViaBun()) return 'bun';
    if (this.isInstalledViaNpm()) return 'npm';
    return 'curl';
  }

  private isInstalledViaBrew(): boolean {
    const result = spawnSync('brew', ['list', 'tnf-cli'], { encoding: 'utf8' });
    return result.status === 0;
  }

  private isInstalledViaNpm(): boolean {
    const result = spawnSync('npm', ['list', '-g', '@the-new-fuse/tnf-cli'], { encoding: 'utf8' });
    return result.status === 0;
  }

  private isInstalledViaPnpm(): boolean {
    const result = spawnSync('pnpm', ['list', '-g', '@the-new-fuse/tnf-cli'], { encoding: 'utf8' });
    return result.status === 0;
  }

  private isInstalledViaBun(): boolean {
    const result = spawnSync('bun', ['pm', 'ls', '-g'], { encoding: 'utf8' });
    return result.status === 0 && result.stdout.includes('@the-new-fuse/tnf-cli');
  }

  private async upgradeViaNpm(version: string): Promise<UpgradeResult> {
    const currentVersion = this.getCurrentVersion();
    try {
      const result = spawnSync('npm', ['install', '-g', `@the-new-fuse/tnf-cli@${version}`], {
        encoding: 'utf8',
        stdio: 'inherit',
      });

      if (result.status === 0) {
        return {
          success: true,
          previousVersion: currentVersion,
          newVersion: version,
          message: `Upgraded from ${currentVersion} to ${version} via npm`,
        };
      }

      return {
        success: false,
        previousVersion: currentVersion,
        message: `npm upgrade failed with exit code ${result.status}`,
      };
    } catch (e) {
      return {
        success: false,
        previousVersion: currentVersion,
        message: `npm upgrade failed: ${(e as Error).message}`,
      };
    }
  }

  private async upgradeViaPnpm(version: string): Promise<UpgradeResult> {
    const currentVersion = this.getCurrentVersion();
    try {
      const result = spawnSync('pnpm', ['add', '-g', `@the-new-fuse/tnf-cli@${version}`], {
        encoding: 'utf8',
        stdio: 'inherit',
      });

      if (result.status === 0) {
        return {
          success: true,
          previousVersion: currentVersion,
          newVersion: version,
          message: `Upgraded from ${currentVersion} to ${version} via pnpm`,
        };
      }

      return {
        success: false,
        previousVersion: currentVersion,
        message: `pnpm upgrade failed with exit code ${result.status}`,
      };
    } catch (e) {
      return {
        success: false,
        previousVersion: currentVersion,
        message: `pnpm upgrade failed: ${(e as Error).message}`,
      };
    }
  }

  private async upgradeViaBun(version: string): Promise<UpgradeResult> {
    const currentVersion = this.getCurrentVersion();
    try {
      const result = spawnSync('bun', ['install', '-g', `@the-new-fuse/tnf-cli@${version}`], {
        encoding: 'utf8',
        stdio: 'inherit',
      });

      if (result.status === 0) {
        return {
          success: true,
          previousVersion: currentVersion,
          newVersion: version,
          message: `Upgraded from ${currentVersion} to ${version} via bun`,
        };
      }

      return {
        success: false,
        previousVersion: currentVersion,
        message: `bun upgrade failed with exit code ${result.status}`,
      };
    } catch (e) {
      return {
        success: false,
        previousVersion: currentVersion,
        message: `bun upgrade failed: ${(e as Error).message}`,
      };
    }
  }

  private async upgradeViaBrew(version: string): Promise<UpgradeResult> {
    const currentVersion = this.getCurrentVersion();
    try {
      const result = spawnSync('brew', ['upgrade', 'tnf-cli'], {
        encoding: 'utf8',
        stdio: 'inherit',
      });

      if (result.status === 0) {
        return {
          success: true,
          previousVersion: currentVersion,
          newVersion: version,
          message: `Upgraded from ${currentVersion} to ${version} via brew`,
        };
      }

      return {
        success: false,
        previousVersion: currentVersion,
        message: `brew upgrade failed with exit code ${result.status}`,
      };
    } catch (e) {
      return {
        success: false,
        previousVersion: currentVersion,
        message: `brew upgrade failed: ${(e as Error).message}`,
      };
    }
  }

  private async upgradeViaCurl(version: string): Promise<UpgradeResult> {
    const currentVersion = this.getCurrentVersion();
    const installUrl = `https://get.thenewfuse.com/tnf-cli/${version}`;
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'tnf-upgrade-'));
    const scriptPath = path.join(tmpDir, 'install.sh');

    try {
      const response = await fetch(installUrl);
      if (!response.ok) {
        return {
          success: false,
          previousVersion: currentVersion,
          message: `Download failed: HTTP ${response.status}`,
        };
      }

      const script = await response.text();
      fs.writeFileSync(scriptPath, script, { mode: 0o700 });

      const result = spawnSync(scriptPath, [], {
        encoding: 'utf8',
        stdio: 'inherit',
        timeout: 120_000,
      });

      if (result.status === 0) {
        return {
          success: true,
          previousVersion: currentVersion,
          newVersion: version,
          message: `Upgraded from ${currentVersion} to ${version} via curl`,
        };
      }

      return {
        success: false,
        previousVersion: currentVersion,
        message: `curl upgrade failed with exit code ${result.status}`,
      };
    } catch (e) {
      return {
        success: false,
        previousVersion: currentVersion,
        message: `curl upgrade failed: ${(e as Error).message}`,
      };
    } finally {
      try {
        fs.rmSync(tmpDir, { recursive: true, force: true });
      } catch {}
    }
  }

  async uninstall(): Promise<{ success: boolean; message: string }> {
    const method = this.detectInstallMethod();

    try {
      switch (method) {
        case 'brew':
          spawnSync('brew', ['uninstall', 'tnf-cli'], { stdio: 'inherit' });
          break;
        case 'npm':
          spawnSync('npm', ['uninstall', '-g', '@the-new-fuse/tnf-cli'], { stdio: 'inherit' });
          break;
        case 'pnpm':
          spawnSync('pnpm', ['remove', '-g', '@the-new-fuse/tnf-cli'], { stdio: 'inherit' });
          break;
        case 'bun':
          spawnSync('bun', ['remove', '-g', '@the-new-fuse/tnf-cli'], { stdio: 'inherit' });
          break;
        default:
          // Remove manually installed binary
          const binPath = '/usr/local/bin/tnf';
          if (fs.existsSync(binPath)) {
            fs.rmSync(binPath);
          }
      }

      // Clean up config and data directories
      const configDir = path.join(os.homedir(), '.config', 'tnf');
      const dataDir = path.join(os.homedir(), '.local', 'share', 'tnf');
      const cacheDir = path.join(os.homedir(), '.cache', 'tnf');

      for (const dir of [configDir, dataDir, cacheDir]) {
        if (fs.existsSync(dir)) {
          fs.rmSync(dir, { recursive: true });
        }
      }

      return {
        success: true,
        message: 'TNF CLI uninstalled successfully. Configuration and data directories removed.',
      };
    } catch (e) {
      return {
        success: false,
        message: `Uninstall failed: ${(e as Error).message}`,
      };
    }
  }
}
