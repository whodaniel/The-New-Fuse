/**
 * Logging utilities for The New Fuse extension
 */

import * as vscode from 'vscode';

// Output channel for logging
let outputChannel: vscode.OutputChannel | null = null;

/**
 * Initialize the logging system
 */
export function initializeLogging(): vscode.OutputChannel {
  if (!outputChannel) {
    outputChannel = vscode.window.createOutputChannel('The New Fuse');
  }
  return outputChannel;
}

/**
 * Log a message to the output channel
 * @param message Message to log
 */
export function log(message: string): void {
  if (!outputChannel) {
    initializeLogging();
  }
  
  const timestamp = new Date().toISOString();
  outputChannel!.appendLine(`[${timestamp}] ${message}`);
}

/**
 * Log an error to the output channel
 * @param message Error message
 * @param error Error object
 */
export function logError(message: string, error?: any): void {
  if (!outputChannel) {
    initializeLogging();
  }
  
  const timestamp = new Date().toISOString();
  const errorMessage = error instanceof Error ? error.message : error ? String(error) : 'Unknown error';
  const stackTrace = error instanceof Error && error.stack ? `\n${error.stack}` : '';
  
  outputChannel!.appendLine(`[${timestamp}] ERROR: ${message} - ${errorMessage}${stackTrace}`);
}

/**
 * Log a warning to the output channel
 * @param message Warning message
 */
export function logWarning(message: string): void {
  if (!outputChannel) {
    initializeLogging();
  }
  
  const timestamp = new Date().toISOString();
  outputChannel!.appendLine(`[${timestamp}] WARNING: ${message}`);
}

/**
 * Show an error message to the user and log it
 * @param message Error message
 * @param error Error object
 */
export function showError(message: string, error?: any): void {
  logError(message, error);
  
  const errorMessage = error instanceof Error ? error.message : error ? String(error) : 'Unknown error';
  vscode.window.showErrorMessage(`${message}: ${errorMessage}`);
}

/**
 * Show an information message to the user and log it
 * @param message Information message
 */
export function showInfo(message: string): void {
  log(message);
  vscode.window.showInformationMessage(message);
}
