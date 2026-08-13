import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

export interface HealthCheck {
  name: string;
  status: 'ok' | 'warn' | 'error';
  message: string;
  fix?: string;
}

export class DoctorService {
  async runChecks(): Promise<HealthCheck[]> {
    const checks: HealthCheck[] = [];

    const nodeVersion = process.version;
    {
      const major = parseInt(nodeVersion.slice(1).split('.')[0]);
      if (major >= 18) {
        checks.push({ name: 'Node.js version', status: 'ok', message: `v${nodeVersion}` });
      } else {
        checks.push({ name: 'Node.js version', status: 'error', message: `v${nodeVersion} (required >=18)`, fix: 'Upgrade Node.js to v18+' });
      }
    }

    {
      const home = os.homedir();
      const configOk = fs.existsSync(path.join(home, '.tnf'));
      if (configOk) {
        checks.push({ name: 'Config directory', status: 'ok', message: '~/.tnf exists' });
      } else {
        checks.push({ name: 'Config directory', status: 'warn', message: '~/.tnf missing', fix: 'Run tnf init or tnf setup' });
      }
    }

    {
      const logDir = path.join(os.homedir(), '.tnf', 'logs');
      if (fs.existsSync(logDir)) {
        checks.push({ name: 'Log directory', status: 'ok', message: 'Logs dir exists' });
      } else {
        checks.push({ name: 'Log directory', status: 'warn', message: 'Log dir missing', fix: 'Create ~/.tnf/logs' });
      }
    }

    {
      const memFile = path.join(os.homedir(), '.tnf', 'memory-providers.json');
      if (fs.existsSync(memFile)) {
        checks.push({ name: 'Memory provider', status: 'ok', message: 'Memory provider configured' });
      } else {
        checks.push({ name: 'Memory provider', status: 'warn', message: 'No memory provider set', fix: 'Run tnf memory switch' });
      }
    }

    return checks;
  }

  async shareReport(): Promise<string> {
    const checks = await this.runChecks();
    const timestamp = new Date().toISOString();
    let report = `TNF Doctor Report\nGenerated: ${timestamp}\n\n`;
    for (const c of checks) {
      const icon = c.status === 'ok' ? '✅' : c.status === 'warn' ? '⚠️' : '❌';
      report += `${icon} ${c.name}: ${c.message}\n`;
      if (c.fix) report += `   Fix: ${c.fix}\n`;
    }
    return report;
  }
}
