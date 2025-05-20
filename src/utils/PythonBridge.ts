import { spawn } from 'child_process';
import { PythonBridgeConfig } from '../protocols/types.js';

export class PythonBridge {
    private process: any;
    private config: PythonBridgeConfig;

    constructor(config: PythonBridgeConfig) {
        this.config = {
            timeout: 30000,
            ...config
        };
    }

    async initialize(): Promise<void> {
        this.process = spawn('python', [this.config.pythonPath]);
        
        this.process.on('error', (err: Error) => {
            throw new Error(`Python bridge error: ${err.message}`);
        });
    }

    async invoke(method: string, args: Record<string, any>): Promise<any> {
        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                reject(new Error('Python bridge timeout'));
            }, this.config.timeout);

            try {
                this.process.stdin.write(JSON.stringify({ method, args }) + '\n');
                
                this.process.stdout.once('data', (data: Buffer) => {
                    clearTimeout(timeout);
                    resolve(JSON.parse(data.toString()));
                });
            } catch (error) {
                clearTimeout(timeout);
                reject(error);
            }
        });
    }

    async terminate(): Promise<void> {
        if (this.process) {
            this.process.kill();
        }
    }
}