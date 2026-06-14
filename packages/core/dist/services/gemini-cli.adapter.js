var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { spawn } from 'child_process';
import { Injectable } from '@nestjs/common';
let GeminiCLIAdapter = class GeminiCLIAdapter {
    async isAvailable() {
        return new Promise((resolve) => {
            const checkProcess = spawn('which', ['gemini'], { stdio: 'pipe', shell: true });
            checkProcess.on('exit', (code) => {
                if (code === 0) {
                    resolve(true);
                }
                else {
                    resolve(false);
                }
            });
        });
    }
    async executeCommand(command) {
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
                }
                else {
                    reject(`Gemini CLI exited with code ${code}`);
                }
            });
        });
    }
};
GeminiCLIAdapter = __decorate([
    Injectable()
], GeminiCLIAdapter);
export { GeminiCLIAdapter };
//# sourceMappingURL=gemini-cli.adapter.js.map