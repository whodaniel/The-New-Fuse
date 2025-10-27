import { spawn } from 'child_process';
export const geminiCLIAdapter = {
  // Implementation needed
}
  async isAvailable(): any {
    return new Promise((resolve) => {
const checkProcess = spawn('which', ['gemini'], { stdio: 'pipe', shell: true });
  }      checkProcess.on('exit', (code) => {
  // Implementation needed
}
        resolve(): void {
        resolve(false);
      });
    });
  },
};