import * as vscode from 'vscode';

export type LogLevel = 'INFO' | 'WARN' | 'ERROR' | 'DEBUG';

export interface Logger {
  info: (message: string, ...meta: any[]) => void;
  warn: (message: string, ...meta: any[]) => void;
  error: (message: string | Error, ...meta: any[]) => void;
  debug: (message: string, ...meta: any[]) => void;
}

let outputChannel: vscode.OutputChannel | undefined;

export function getLogger(name: string = 'The New Fuse'): Logger {
  if (!outputChannel) {
    outputChannel = vscode.window.createOutputChannel("The New Fuse Extension");
  }

  return {
    info: (message: string, ...meta: any[]): void => {
      outputChannel!.appendLine(`[${new Date().toISOString()}] [INFO] [${name}] ${message} ${meta.length > 0 ? meta.map(m => JSON.stringify(m)).join(' ') : ''}`);
    },
    warn: (message: string, ...meta: any[]): void => {
      outputChannel!.appendLine(`[${new Date().toISOString()}] [WARN] [${name}] ${message} ${meta.length > 0 ? meta.map(m => JSON.stringify(m)).join(' ') : ''}`);
    },
    error: (message: string | Error, ...meta: any[]): void => {
      const errorMessage = message instanceof Error ? message.message + (message.stack ? `\nSTACK: ${message.stack}` : '') : message;
      outputChannel!.appendLine(`[${new Date().toISOString()}] [ERROR] [${name}] ${errorMessage} ${meta.length > 0 ? meta.map(m => JSON.stringify(m)).join(' ') : ''}`);
    },
    debug: (message: string, ...meta: any[]): void => {
      outputChannel!.appendLine(`[${new Date().toISOString()}] [DEBUG] [${name}] ${message} ${meta.length > 0 ? meta.map(m => JSON.stringify(m)).join(' ') : ''}`);
    },
  };
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}

export const VSCodeLogger: Logger = getLogger("VSCodeExtension");