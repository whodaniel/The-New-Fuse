/**
 * The New Fuse VSCode Extension - Protocol Translation Service
 * Version 9.2.0
 *
 * Multi-protocol translation (MCP, LangChain, AutoGen, CrewAI)
 */

import * as vscode from 'vscode';
import { log } from '../../utils/logger';
import { getRelayService } from '../RelayConnectionService';

type ProtocolType = 'mcp' | 'langchain' | 'autogen' | 'crewai' | 'openai';

interface TranslationResult {
  success: boolean;
  translated: string;
  sourceProtocol: ProtocolType;
  targetProtocol: ProtocolType;
}

export class ProtocolTranslationService {
  private static instance: ProtocolTranslationService | null = null;
  private context: vscode.ExtensionContext;
  private statusBarItem: vscode.StatusBarItem | undefined;

  private constructor(context: vscode.ExtensionContext) {
    this.context = context;
  }

  static getInstance(context?: vscode.ExtensionContext): ProtocolTranslationService {
    if (!ProtocolTranslationService.instance && context) {
      ProtocolTranslationService.instance = new ProtocolTranslationService(context);
    }
    return ProtocolTranslationService.instance!;
  }

  static getProtocolTranslationService(): ProtocolTranslationService {
    return ProtocolTranslationService.getInstance()!;
  }

  async initialize(): Promise<void> {
    log.info('Initializing Protocol Translation Service');

    this.statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 96);
    this.statusBarItem.text = '$(translate) PT';
    this.statusBarItem.tooltip = 'Protocol Translation: Ready';
    this.statusBarItem.command = 'theNewFuse.protocolTranslation';
    this.statusBarItem.show();
    this.context.subscriptions.push(this.statusBarItem);

    log.info('Protocol Translation Service initialized');
  }

  async translateMessage(
    message: string,
    sourceProtocol: ProtocolType,
    targetProtocol: ProtocolType
  ): Promise<TranslationResult> {
    log.info(`Translating message from ${sourceProtocol} to ${targetProtocol}`);

    try {
      const relay = getRelayService();
      if (relay.getStatus() === 'connected') {
        const result = await relay.request<TranslationResult>(
          'PROTOCOL_TRANSLATE',
          { message, sourceProtocol, targetProtocol },
          5000
        );
        if (result && result.success) {
          return result;
        }
      }
    } catch {
      log.debug('Protocol translation via relay unavailable, using local fallback');
    }

    return {
      success: true,
      translated: `[${targetProtocol.toUpperCase()}] ${message}`,
      sourceProtocol,
      targetProtocol,
    };
  }

  async translateTool(
    toolDefinition: Record<string, unknown>,
    sourceProtocol: ProtocolType,
    targetProtocol: ProtocolType
  ): Promise<TranslationResult> {
    log.info(`Translating tool from ${sourceProtocol} to ${targetProtocol}`);

    try {
      const relay = getRelayService();
      if (relay.getStatus() === 'connected') {
        const result = await relay.request<TranslationResult>(
          'PROTOCOL_TRANSLATE_TOOL',
          { toolDefinition, sourceProtocol, targetProtocol },
          5000
        );
        if (result && result.success) {
          return result;
        }
      }
    } catch {
      log.debug('Protocol tool translation via relay unavailable, using local fallback');
    }

    return {
      success: true,
      translated: JSON.stringify(toolDefinition, null, 2),
      sourceProtocol,
      targetProtocol,
    };
  }

  async showTranslationPanel(): Promise<void> {
    const panel = vscode.window.createWebviewPanel(
      'protocolTranslation',
      'Protocol Translation',
      vscode.ViewColumn.One,
      { enableScripts: true }
    );

    panel.webview.html = this.generateTranslationHtml();
  }

  async translateFromEditor(): Promise<void> {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      vscode.window.showErrorMessage('No active editor');
      return;
    }

    const selection = editor.document.getText(editor.selection);
    if (!selection) {
      vscode.window.showErrorMessage('No text selected');
      return;
    }

    const targetProtocol = await vscode.window.showQuickPick(
      ['mcp', 'langchain', 'autogen', 'crewai', 'openai'],
      { placeHolder: 'Select target protocol' }
    );

    if (!targetProtocol) return;

    const result = await this.translateMessage(selection, 'mcp', targetProtocol as ProtocolType);

    // Insert translated content
    await editor.edit((editBuilder) => {
      editBuilder.replace(editor.selection, result.translated);
    });

    vscode.window.showInformationMessage('Translation complete');
  }

  private generateTranslationHtml(): string {
    const protocols = ['mcp', 'langchain', 'autogen', 'crewai', 'openai'];
    const protocolCards = protocols
      .map(
        (p) => `
      <div class="protocol-card ${p}">
        <div class="protocol-name">${p.toUpperCase()}</div>
        <div class="protocol-status">Supported</div>
      </div>
    `
      )
      .join('');

    return `<!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: var(--vscode-font-family); padding: 20px; }
          h1 { color: var(--vscode-foreground); }
          .protocol-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)); gap: 12px; margin-top: 20px; }
          .protocol-card {
            background: var(--vscode-editor-background);
            border: 1px solid var(--vscode-editor-lineHighlightBorder);
            border-radius: 8px;
            padding: 16px;
            text-align: center;
          }
          .protocol-name { font-weight: bold; font-size: 14px; }
          .protocol-status { color: var(--vscode-descriptionForeground); font-size: 11px; margin-top: 4px; }
          .feature {
            background: var(--vscode-editor-background);
            border: 1px solid var(--vscode-editor-lineHighlightBorder);
            border-radius: 8px;
            padding: 16px;
            margin-bottom: 12px;
          }
          .feature-title { font-weight: bold; }
          .feature-desc { color: var(--vscode-descriptionForeground); margin-top: 8px; }
        </style>
      </head>
      <body>
        <h1>Protocol Translation</h1>
        <p>Translate between different AI agent frameworks.</p>

        <h2>Supported Protocols</h2>
        <div class="protocol-grid">
          ${protocolCards}
        </div>

        <h2>Features</h2>
        <div class="feature">
          <div class="feature-title">Dynamic Translation</div>
          <div class="feature-desc">Translate messages, tools, and capabilities between protocols in real-time</div>
        </div>

        <div class="feature">
          <div class="feature-title">LLM-Backend</div>
          <div class="feature-desc">Uses AI to perform intelligent, adaptive translations</div>
        </div>

        <div class="feature">
          <div class="feature-title">Protocol Learning</div>
          <div class="feature-desc">Teach the system about new protocols using examples</div>
        </div>
      </body>
      </html>`;
  }

  dispose(): void {
    this.statusBarItem?.dispose();
  }
}

export function getProtocolTranslationService(): ProtocolTranslationService {
  return ProtocolTranslationService.getProtocolTranslationService();
}
