import * as vscode from 'vscode';
import { ExtensionScanner } from './extensionScanner.js';
import { CapabilityRegistry } from './capabilityRegistry.js';
import { Agent, AgentEventData, AgentRegistrationRequest } from './types.js';

/**
 * Main class for agent discovery functionality
 */
export class AgentDiscovery {
  private scanner: ExtensionScanner;
  private registry: CapabilityRegistry;
  private extensionWatcher: vscode.Disposable | null = null;
  
  constructor() {
    this.scanner = new ExtensionScanner();
    this.registry = new CapabilityRegistry();
  }
  
  /**
   * Initialize the agent discovery system
   */
  public async initialize(): Promise<void> {
    // Scan for existing AI extensions
    const extensions = await this.scanner.scanForAIExtensions();
    console.log(`[AgentDiscovery] Found ${extensions.length} potential AI extensions`);
    
    // Set up watcher for extension changes
    this.extensionWatcher = this.scanner.registerExtensionWatcher(
      this.handleExtensionActivation.bind(this),
      this.handleExtensionDeactivation.bind(this)
    );
    
    // Register command for manual agent registration
    vscode.commands.registerCommand('thefuse.registerAgent', this.handleAgentRegistration.bind(this));
  }
  
  /**
   * Get the capability registry
   */
  public getRegistry(): CapabilityRegistry {
    return this.registry;
  }
  
  /**
   * Subscribe to agent events
   */
  public onAgentEvent(listener: (event: AgentEventData) => void): vscode.Disposable {
    return this.registry.onAgentEvent(listener);
  }
  
  /**
   * Register an agent manually
   */
  public registerAgent(request: AgentRegistrationRequest, extensionId: string): Agent {
    return this.registry.registerAgent(request, extensionId);
  }
  
  /**
   * Dispose of resources
   */
  public dispose(): void {
    if (this.extensionWatcher) {
      this.extensionWatcher.dispose();
      this.extensionWatcher = null;
    }
  }
  
  private handleExtensionActivation(extension: vscode.Extension<any>): void {
    console.log(`[AgentDiscovery] Extension activated: ${extension.id}`);
    
    // Detect capabilities
    const capabilities = this.scanner.detectCapabilities(extension);
    
    // Create a temporary agent registration for this extension
    // The extension can later register itself properly
    const tempAgentId = `auto-${extension.id}`;
    this.registry.registerAgent({
      id: tempAgentId,
      name: extension.packageJSON.displayName || extension.id,
      capabilities,
      version: extension.packageJSON.version || '0.0.0',
      apiVersion: '1.0.0'
    }, extension.id);
    
    // Attempt to notify the extension about The Fuse
    try {
      extension.exports?.onFuseAvailable?.({
        registerAgent: this.handleAgentRegistration.bind(this)
      });
    } catch (error) {
      console.error(`[AgentDiscovery] Failed to notify extension ${extension.id}`, error);
    }
  }
  
  private handleExtensionDeactivation(extensionId: string): void {
    console.log(`[AgentDiscovery] Extension deactivated: ${extensionId}`);
    
    // Find all agents from this extension
    const agents = this.registry.getAllAgents().filter(a => a.extensionId === extensionId);
    
    // Update their status or unregister them
    agents.forEach(agent => {
      this.registry.updateAgentStatus(agent.id, false);
    });
  }
  
  private handleAgentRegistration(request: AgentRegistrationRequest): Agent {
    // Get the calling extension ID
    const caller = this.getCallingExtension();
    if (!caller) {
      throw new Error('Cannot register agent: Unable to identify calling extension');
    }
    
    console.log(`[AgentDiscovery] Registering agent ${request.id} from ${caller.id}`);
    return this.registry.registerAgent(request, caller.id);
  }
  
  private getCallingExtension(): vscode.Extension<any> | undefined {
    // This is a simplified approach and might not be 100% reliable
    // A more robust solution would involve passing extension IDs explicitly
    const stack = new Error().stack || '';
    for (const extension of vscode.extensions.all) {
      // Check if the extension's path appears in the stack trace
      if (extension.extensionPath && stack.includes(extension.extensionPath)) {
        return extension;
      }
    }
    return undefined;
  }
}
