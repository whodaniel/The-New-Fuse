import * as vscode from 'vscode';
import { ExtensionCapability } from './types.js';

/**
 * Responsible for scanning and detecting AI-capable extensions in the VS Code environment
 */
export class ExtensionScanner {
  private knownAIExtensionIds = [
    'GitHub.copilot',
    'GitHub.copilot-chat',
    'anthropic.claude',
    'codeium.codeium',
    'sourcegraph.cody-ai',
    // Add other known AI extension IDs
  ];

  /**
   * Scan for all installed extensions that might have AI capabilities
   */
  public async scanForAIExtensions(): Promise<vscode.Extension<any>[]> {
    const allExtensions = vscode.extensions.all;
    
    // Filter extensions that are likely AI-capable
    return allExtensions.filter(extension => {
      // Check if it's in our known list
      if (this.knownAIExtensionIds.includes(extension.id)) {
        return true;
      }
      
      // Check package.json for AI-related keywords
      const packageJson = extension.packageJSON;
      if (!packageJson) {
        return false;
      }
      
      // Check keywords
      const keywords = packageJson.keywords || [];
      return keywords.some((keyword: string) => 
        ['ai', 'artificial intelligence', 'machine learning', 'copilot', 'code generation', 'llm']
          .includes(keyword.toLowerCase())
      );
    });
  }

  /**
   * Detect capabilities of an extension
   */
  public detectCapabilities(extension: vscode.Extension<any>): ExtensionCapability[] {
    const capabilities: ExtensionCapability[] = [];
    const packageJson = extension.packageJSON;
    
    // Check commands to infer capabilities
    const commands = packageJson.contributes?.commands || [];
    for (const command of commands) {
      if (command.title.toLowerCase().includes('generate')) {
        capabilities.push('code-generation');
      }
      if (command.title.toLowerCase().includes('explain')) {
        capabilities.push('code-explanation');
      }
      if (command.title.toLowerCase().includes('test')) {
        capabilities.push('test-generation');
      }
      // Add more capability detection logic
    }
    
    return [...new Set(capabilities)]; // Remove duplicates
  }

  /**
   * Set up listeners for extension activation/deactivation
   */
  public registerExtensionWatcher(
    onActivation: (extension: vscode.Extension<any>) => void,
    onDeactivation: (extensionId: string) => void
  ): vscode.Disposable {
    // We can't directly listen for deactivation, but we can poll for changes
    const checkInterval = 10000; // 10 seconds
    const knownExtensions = new Map<string, vscode.Extension<any>>();
    
    // Initial scan
    this.scanForAIExtensions().then(extensions => {
      extensions.forEach(ext => knownExtensions.set(ext.id, ext));
    });
    
    const intervalHandle = setInterval(async () => {
      const currentExtensions = await this.scanForAIExtensions();
      const currentIds = new Set(currentExtensions.map(ext => ext.id));
      
      // Check for newly activated extensions
      currentExtensions.forEach(ext => {
        if (!knownExtensions.has(ext.id)) {
          knownExtensions.set(ext.id, ext);
          onActivation(ext);
        }
      });
      
      // Check for deactivated extensions
      knownExtensions.forEach((ext, id) => {
        if (!currentIds.has(id)) {
          knownExtensions.delete(id);
          onDeactivation(id);
        }
      });
    }, checkInterval);
    
    return {
      dispose: () => clearInterval(intervalHandle)
    };
  }
}
