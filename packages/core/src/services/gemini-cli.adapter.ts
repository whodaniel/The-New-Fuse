import { spawn } from 'child_process';
import { Injectable } from '@nestjs/common';

@Injectable()
export class GeminiCLIAdapter {
  async isAvailable(): Promise<boolean> {
    return new Promise((resolve) => {
      const checkProcess = spawn('which', ['gemini'], { stdio: 'pipe', shell: true });
      checkProcess.on('exit', (code) => {
        if (code === 0) {
          resolve(true);
        } else {
          resolve(false);
        }
      });
    });
  }

  async executeCommand(command: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const geminiProcess = spawn('gemini', [command], { stdio: 'pipe', shell: true });

      let output = '';
      geminiProcess.stdout.on('data', (data) => {
        output += data.toString();
      });

      geminiProcess.stderr.on('data', (data) => {
        reject(data.toString());
      });

      geminiProcess.on('exit', (code) => {
        if (code === 0) {
          resolve(output);
        } else {
          reject(`Gemini CLI exited with code ${code}`);
        }
      });
    });
  }
}
