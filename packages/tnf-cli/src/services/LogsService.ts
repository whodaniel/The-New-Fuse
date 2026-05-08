import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

export class LogsService {
  private logDir: string;

  constructor() {
    this.logDir = path.join(os.homedir(), '.tnf', 'logs');
  }

  async tail(lines: number = 50, logType: string = 'agent'): Promise<string[]> {
    const logFile = path.join(this.logDir, `${logType}.log`);
    if (!fs.existsSync(logFile)) return [];
    const content = fs.readFileSync(logFile, 'utf8');
    return content.split('\n').slice(-lines);
  }

  async errors(): Promise<string[]> {
    const errorLog = path.join(this.logDir, 'errors.log');
    if (!fs.existsSync(errorLog)) return [];
    return fs.readFileSync(errorLog, 'utf8').split('\n').filter(l => l.trim());
  }

  async since(duration: string): Promise<string[]> {
    const agentLog = path.join(this.logDir, 'agent.log');
    if (!fs.existsSync(agentLog)) return [];
    const match = duration.match(/(\d+)([hdwm]?)/);
    if (!match) return [];
    const hours = parseInt(match[1]) * (match[2] === 'd' ? 24 : match[2] === 'w' ? 168 : 1);
    const sinceTime = Date.now() - (hours * 3600000);
    const lines = fs.readFileSync(agentLog, 'utf8').split('\n');
    return lines.filter(line => {
      const dateMatch = line.match(/^(\d{4}-\d{2}-\d{2})/);
      if (dateMatch) {
        const lineTime = new Date(dateMatch[1]).getTime();
        return lineTime >= sinceTime;
      }
      return true;
    });
  }

  async follow(callback: (line: string) => void, logType: string = 'agent'): Promise<void> {
    const logFile = path.join(this.logDir, `${logType}.log`);
    if (!fs.existsSync(logFile)) return;
    // Simplified - in production would use fs.watchFile or tail -f equivalent
    const content = fs.readFileSync(logFile, 'utf8');
    const lines = content.split('\n');
    for (const line of lines.slice(-10)) {
      if (line.trim()) callback(line);
    }
  }
}
