import { spawn } from 'child_process';
import http from 'http';

function waitForServer(url: string, timeout: number): Promise<void> {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();

    const checkServer = (): void => {
      http
        .get(url, (res) => {
          if (res.statusCode === 200) {
            resolve();
          } else {
            retry();
          }
        })
        .on('error', retry);

      function retry(): void {
        const elapsed = Date.now() - startTime;
        if (elapsed > timeout) {
          reject(new Error(`Server not ready after ${timeout}ms`));
        } else {
          setTimeout(checkServer, 1000);
        }
      }
    };

    checkServer();
  });
}

async function startServer(): Promise<void> {
  // Kill any existing process on port 5173
  try {
    await new Promise<void>((resolve) => {
      const kill = spawn('kill', [`$(lsof -t -i:5173)`], { shell: true });
      kill.on('close', resolve);
    });
  } catch {
    // Ignore errors when killing process
  }

  const server = spawn('pnpm', ['dev'], {
    stdio: 'inherit',
    shell: true,
    env: {
      ...process.env,
      PORT: '5173',
    },
  });

  try {
    await waitForServer('http://localhost:5173', 30000);

    return server;
  } catch (error) {
    console.error('Failed to start dev server:', error);
    server.kill();
    process.exit(1);
  }
}

export { startServer };
