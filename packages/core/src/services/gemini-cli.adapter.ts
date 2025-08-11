import { spawn } from 'child_process';
export const geminiCLIAdapter = {
  // Implementation needed
}
  async isAvailable(): Promise<boolean> => {
  // Implementation needed
}
    return new Promise((resolve) => {
  // Implementation needed
}
      const checkProcess = spawn('which', ['gemini'], { stdio: 'pipe', shell: true });
      checkProcess.on('exit', (code) => {
  // Implementation needed
}
        resolve(code === 0);
      });
      checkProcess.on('error', () => {
  // Implementation needed
}
        resolve(false);
      });
    });
  },
};