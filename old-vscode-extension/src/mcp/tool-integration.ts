import * as vscode from 'vscode';

/**
 * Tool parameter schema
 */
interface ToolParameterSchema {
  type: string;
  properties: Record<string, any>;
  required?: string[];
}

/**
 * Tool definition
 */
interface ToolDefinition {
  name: string;
  description: string;
  parameters: ToolParameterSchema;
  execute: (params: any) => Promise<any>;
}

/**
 * VSCode Tool Integration for MCP
 */
export class VscodeToolIntegration {
  private tools: Map<string, ToolDefinition> = new Map();
  private context: vscode.ExtensionContext;

  constructor(context: vscode.ExtensionContext) {
    this.context = context;
    this.registerCommands();
  }

  /**
   * Register a tool with the integration
   */
  public registerTool(tool: ToolDefinition): void {
    this.tools.set(tool.name, tool);
    console.log(`Registered tool: ${tool.name}`);
  }

  /**
   * Get a tool by name
   */
  public getTool(name: string): ToolDefinition | undefined {
    return this.tools.get(name);
  }

  /**
   * Get all registered tools
   */
  public getAllTools(): ToolDefinition[] {
    return Array.from(this.tools.values());
  }

  /**
   * Execute a tool by name with parameters
   */
  public async executeTool(name: string, params: any): Promise<any> {
    const tool = this.tools.get(name);
    if (!tool) {
      throw new Error(`Tool not found: ${name}`);
    }

    try {
      return await tool.execute(params);
    } catch (error) {
      console.error(`Error executing tool ${name}:`, error);
      throw error;
    }
  }

  /**
   * Register commands for tool integration
   */
  private registerCommands(): void {
    // Register command to show available tools
    this.context.subscriptions.push(
      vscode.commands.registerCommand('thefuse.mcp.showTools', () => {
        this.showToolsList();
      })
    );

    // Register command to test a tool
    this.context.subscriptions.push(
      vscode.commands.registerCommand('thefuse.mcp.testTool', async () => {
        await this.testTool();
      })
    );
  }

  /**
   * Show a list of available tools
   */
  private async showToolsList(): Promise<void> {
    const tools = this.getAllTools();
    
    if (tools.length === 0) {
      vscode.window.showInformationMessage('No MCP tools are registered.');
      return;
    }

    const toolItems = tools.map(tool => ({
      label: tool.name,
      description: tool.description,
      tool
    }));

    const selectedTool = await vscode.window.showQuickPick(toolItems, {
      placeHolder: 'Select a tool to view details',
      title: 'MCP Tools'
    });

    if (selectedTool) {
      const toolDetails = `
# ${selectedTool.tool.name}

${selectedTool.tool.description}

## Parameters

\`\`\`json
${JSON.stringify(selectedTool.tool.parameters, null, 2)}
\`\`\`
`;

      const doc = await vscode.workspace.openTextDocument({
        content: toolDetails,
        language: 'markdown'
      });
      
      await vscode.window.showTextDocument(doc);
    }
  }

  /**
   * Test a tool with user-provided parameters
   */
  private async testTool(): Promise<void> {
    const tools = this.getAllTools();
    
    if (tools.length === 0) {
      vscode.window.showInformationMessage('No MCP tools are registered.');
      return;
    }

    const toolItems = tools.map(tool => ({
      label: tool.name,
      description: tool.description,
      tool
    }));

    const selectedTool = await vscode.window.showQuickPick(toolItems, {
      placeHolder: 'Select a tool to test',
      title: 'Test MCP Tool'
    });

    if (!selectedTool) {
      return;
    }

    // Create a JSON template for the parameters
    const requiredParams = selectedTool.tool.parameters.required || [];
    const paramTemplate: Record<string, any> = {};
    
    for (const paramName of requiredParams) {
      const paramDef = selectedTool.tool.parameters.properties[paramName];
      if (paramDef) {
        paramTemplate[paramName] = getDefaultValueForType(paramDef.type);
      }
    }

    // Open an editor with the parameter template
    const doc = await vscode.workspace.openTextDocument({
      content: JSON.stringify(paramTemplate, null, 2),
      language: 'json'
    });
    
    const editor = await vscode.window.showTextDocument(doc);
    
    // Register a command to execute the tool with the parameters
    const disposable = vscode.commands.registerCommand('thefuse.mcp.executeTestTool', async () => {
      try {
        const params = JSON.parse(editor.document.getText());
        const result = await this.executeTool(selectedTool.tool.name, params);
        
        // Show the result
        const resultDoc = await vscode.workspace.openTextDocument({
          content: JSON.stringify(result, null, 2),
          language: 'json'
        });
        
        await vscode.window.showTextDocument(resultDoc);
        
        vscode.window.showInformationMessage(`Tool ${selectedTool.tool.name} executed successfully.`);
      } catch (error) {
        vscode.window.showErrorMessage(`Error executing tool: ${error}`);
      }
    });
    
    this.context.subscriptions.push(disposable);
    
    // Show a message to the user
    vscode.window.showInformationMessage(
      `Edit the parameters for ${selectedTool.tool.name} and run the 'Execute Test Tool' command when ready.`,
      'Execute Test Tool'
    ).then(selection => {
      if (selection === 'Execute Test Tool') {
        vscode.commands.executeCommand('thefuse.mcp.executeTestTool');
      }
    });
  }
}

/**
 * Get a default value for a parameter type
 */
function getDefaultValueForType(type: string): any {
  switch (type) {
    case 'string':
      return '';
    case 'number':
    case 'integer':
      return 0;
    case 'boolean':
      return false;
    case 'array':
      return [];
    case 'object':
      return {};
    default:
      return null;
  }
}
