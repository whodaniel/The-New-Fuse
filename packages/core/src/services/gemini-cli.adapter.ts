import { spawn } from 'child_process';

export const geminiCLIAdapter = {
  isAvailable: async (): Promise<boolean> => {
    return new Promise((resolve) => {
      const checkProcess = spawn('which', ['gemini'], { stdio: 'pipe', shell: true });
      checkProcess.on('exit', (code) => {
        resolve(code === 0);
      });
      checkProcess.on('error', () => {
        resolve(false);
      });
    });
  },
};