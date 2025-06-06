import * as cp from 'child_process';
import * as net from 'net';
import * as vscode from 'vscode';

interface MonitoredApplication {
  id: string;
  displayName: string;
  processName?: string; // e.g., "Claude" on macOS, "Claude.exe" on Windows
  ports?: number[];     // Ports to check, e.g., [3000, 8080]
  dockerServiceNames?: string[]; // Names of docker containers/services
  // Add other detection methods as needed
}

export class ApplicationMonitor {
  private monitoredApps: MonitoredApplication[] = [
    // Example: Add applications you want to monitor here
    // { id: 'claudeDesktop', displayName: 'Claude Desktop', processName: 'Claude', ports: [3000] },
    // { id: 'myDockerService', displayName: 'My Docker Service', dockerServiceNames: ['my_mcp_service_in_docker'], ports: [8080] }
  ];
  private detectedServices: Map<string, boolean> = new Map();
  private pollInterval: number = 15000; // 15 seconds
  private intervalId?: NodeJS.Timeout;

  constructor(private context: vscode.ExtensionContext) {
    // You can load monitoredApps from configuration if needed
  }

  public startMonitoring() {
    if (this.intervalId) {
      this.stopMonitoring();
    }
    console.log('[ApplicationMonitor] Starting...'); // Changed log
    this.performChecks(); // Initial check
    this.intervalId = setInterval(() => this.performChecks(), this.pollInterval);
    this.context.subscriptions.push({ dispose: () => this.stopMonitoring() });
  }

  public stopMonitoring() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = undefined;
      console.log('[ApplicationMonitor] Stopped.'); // Changed log
    }
  }

  private async performChecks() {
    if (this.monitoredApps.length === 0) {
        console.log('[ApplicationMonitor] No applications configured for monitoring.'); // Uncommented
        return;
    }
    console.log('[ApplicationMonitor] Performing application checks...'); // Uncommented
    for (const app of this.monitoredApps) {
      let isDetected = false;
      console.log(`[ApplicationMonitor] Checking application: ${app.displayName}`);
      try {
        if (app.processName) {
          isDetected = await this.isProcessRunning(app.processName);
          console.log(`[ApplicationMonitor] ${app.displayName} process (${app.processName}) check: ${isDetected}`); // Corrected
        }
        if (!isDetected && app.ports && app.ports.length > 0) {
          console.log(`[ApplicationMonitor] ${app.displayName} process not detected or not primary, checking ports: ${app.ports}`);
          for (const port of app.ports) {
            const portOpen = await this.isPortOpen(port);
            console.log(`[ApplicationMonitor] ${app.displayName} port ${port} check: ${portOpen}`); // Corrected
            if (portOpen) {
              isDetected = true;
              break;
            }
          }
        } else if (app.ports && app.ports.length > 0 && isDetected && app.processName) {
          // If process was detected, still good to log port checks if configured, for informational purposes
           console.log(`[ApplicationMonitor] ${app.displayName} process already detected. Informational port check for: ${app.ports}`);
            for (const port of app.ports) {
                const portOpen = await this.isPortOpen(port);
                console.log(`[ApplicationMonitor] ${app.displayName} (informational) port ${port} check: ${portOpen}`); // Corrected
            }
        }

        // TODO: Add Docker checks using app.dockerServiceNames
        if (app.dockerServiceNames && app.dockerServiceNames.length > 0) {
            console.log(`[ApplicationMonitor] ${app.displayName} checking Docker services: ${app.dockerServiceNames}`);
            // const dockerDetected = await this.checkDockerServices(app.dockerServiceNames);
            // if (dockerDetected) isDetected = true; // Or handle Docker detection logic appropriately
        }

        const previouslyDetected = this.detectedServices.get(app.id);
        if (isDetected && !previouslyDetected) {
          console.log(`[ApplicationMonitor] ${app.displayName} newly detected.`);
          vscode.window.showInformationMessage(`${app.displayName} detected and is now available!`);
          // You can emit an event here or call a callback if other parts of your extension need to react
        } else if (!isDetected && previouslyDetected) {
          console.log(`[ApplicationMonitor] ${app.displayName} no longer detected.`);
          vscode.window.showInformationMessage(`${app.displayName} is no longer available.`);
        } else if (isDetected && previouslyDetected) {
          // console.log(`[ApplicationMonitor] ${app.displayName} remains detected.`);
        } else {
          // console.log(`[ApplicationMonitor] ${app.displayName} remains not detected.`);
        }
        this.detectedServices.set(app.id, isDetected);
      } catch (error) {
        console.error(`[ApplicationMonitor] Error checking ${app.displayName}: `, error);
      }
    }
  }

  private isProcessRunning(processName: string): Promise<boolean> {
    return new Promise((resolve) => {
      const command = process.platform === 'win32' ?
        `tasklist | findstr /i "${processName}.exe"` :
        `ps aux | grep -i "[${processName[0]}]${processName.substring(1)}"`;
      // console.log(`[ApplicationMonitor] Executing process check: ${command}`);
      cp.exec(command, (err, stdout, stderr) => {
        if (err && !stdout) {
            console.warn(`[ApplicationMonitor] Error or no output executing process check for '${processName}':`, err ? err.message : 'No error object', stderr ? stderr.trim() : 'No stderr');
            resolve(false);
            return;
        }
        const processFound = stdout.toLowerCase().includes(processName.toLowerCase());
        // console.log(`[ApplicationMonitor] Process check for '${processName}' stdout:\n${stdout}`);
        resolve(processFound);
      });
    });
  }

  private isPortOpen(port: number, host: string = '127.0.0.1'): Promise<boolean> {
    return new Promise((resolve) => {
      const socket = new net.Socket();
      const timeout = 2000;
      socket.setTimeout(timeout);
      // console.log(`[ApplicationMonitor] Attempting to connect to ${host}:${port}`);

      socket.on('connect', () => {
        // console.log(`[ApplicationMonitor] Connection to ${host}:${port} successful.`);
        socket.destroy();
        resolve(true);
      });

      socket.on('timeout', () => {
        // console.warn(`[ApplicationMonitor] Connection to ${host}:${port} timed out.`);
        socket.destroy();
        resolve(false);
      });

      socket.on('error', (err: NodeJS.ErrnoException) => { // Added type for err
        console.warn(`[ApplicationMonitor] Error connecting to port ${port} on ${host}: ${err.message}`); // Uncommented and enhanced
        socket.destroy();
        resolve(false);
      });

      socket.connect(port, host);
    });
  }

  // Placeholder for Docker check
  // private async checkDockerServices(serviceNames: string[]): Promise<boolean> {
  //   // Implement Docker checks, e.g., using 'docker ps' and 'docker inspect'
  //   console.log('[ApplicationMonitor] Checking Docker services:', serviceNames); // Uncommented
  //   return false;
  // }
}
