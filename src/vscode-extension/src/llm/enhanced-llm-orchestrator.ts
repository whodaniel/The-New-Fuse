import * as vscode from 'vscode';
import { MCPManagerImpl } from '../mcp-integration/mcp-manager.js';
import { MCPServer } from '../types/mcp.js';
import { MCPToolExecutor } from '../mcp-integration/mcp-tool-executor.js';
import { getLogger } from '../core/logging.js';
import { getCodeAnalyzer } from '../utils/code-analyzer.js';
import { debounce } from '../utils/performance-utils.js';

/**
 * Enhanced LLM Orchestrator that integrates with MCP
 * Inspired by Copilot's architecture for advanced tool-using capabilities
 */
export class EnhancedLLMOrchestrator {
  private mcpManager: MCPManagerImpl;
  private toolExecutor: MCPToolExecutor;
  private logger;
  private codeAnalyzer: any;
  private disposables: vscode.Disposable[] = [];
  
  private _onToolExecuted = new vscode.EventEmitter<{
    tool: string;
    params: Record<string, any>;
    result: any;
  }>();
  readonly onToolExecuted = this._onToolExecuted.event;
  
  constructor(context: vscode.ExtensionContext) {
    this.logger = getLogger();
    
    // Initialize the MCP Manager
    this.mcpManager = new MCPManagerImpl(context, this.logger);
    
    // Initialize the Tool Executor
    this.toolExecutor = new MCPToolExecutor(this.mcpManager);
    
    // Initialize code analyzer
    this.codeAnalyzer = getCodeAnalyzer();
    
    // Register event handlers
    this.registerEventHandlers();
    
    // Initialize the code analyzer
    this.initializeCodeAnalyzer();
  }
  
  /**
   * Initialize the code analyzer
   */
  private async initializeCodeAnalyzer(): Promise<void> {
    try {
      await this.codeAnalyzer.initialize();
      this.logger.info('Code analyzer initialized successfully');
      
      // Register document change handler
      const debouncedAnalyze = debounce(this.analyzeActiveDocument.bind(this), 500);
      this.disposables.push(
        vscode.workspace.onDidChangeTextDocument(event => {
          if (event.document === vscode.window.activeTextEditor?.document) {
            debouncedAnalyze();
          }
        })
      );
      
      // Analyze the current active document
      this.analyzeActiveDocument();
    } catch (error) {
      this.logger.error(`Failed to initialize code analyzer: ${error}`);
    }
  }
  
  /**
   * Analyze the active document to extract context
   */
  private async analyzeActiveDocument(): Promise<void> {
    const editor = vscode.window.activeTextEditor;
    if (!editor) return;
    
    try {
      const document = editor.document;
      const analysis = await this.codeAnalyzer.analyzeDocument(document);
      
      this.logger.debug(`Document analyzed: ${document.uri.fsPath}`);
      this.logger.debug(`Analysis summary: ${analysis.summary}`);
    } catch (error) {
      this.logger.error(`Failed to analyze document: ${error}`);
    }
  }
  
  /**
   * Register event handlers
     */
    private registerEventHandlers(): void {
        // Listen for active server changes
        this.disposables.push(
            this.mcpManager.onActiveServerChanged((server: MCPServer | undefined) => { // Add explicit type
                if (server) {
                    this.logger.info(`Active MCP server changed: ${server.name}`);
                    // Update available tools when active server changes
          this.refreshAvailableTools();
        } else {
          this.logger.info('No active MCP server');
        }
      })
    );
    
        // Listen for server updates
        this.disposables.push(
            this.mcpManager.onServerUpdated((server: MCPServer) => { // Add explicit type
                if (server.id === this.mcpManager.getActiveServer()?.id) {
                    this.logger.info(`Active MCP server updated: ${server.name}`);
                    // Update available tools when active server is updated
          this.refreshAvailableTools();
        }
      })
    );
  }
  
  /**
   * Refresh available tools from the active server
   */
  private async refreshAvailableTools(): Promise<void> {
    try {
      const tools = await this.toolExecutor.getAvailableTools();
      this.logger.info(`Retrieved ${tools.length} tools from active MCP server`);
    } catch (error) {
      this.logger.error(`Failed to refresh available tools: ${error}`);
    }
  }
  
  /**
   * Generate an LLM prompt with the current context and available tools
   * This is inspired by how Copilot constructs prompts with tool capabilities
   */
  public async generateEnhancedPrompt(basePrompt: string): Promise<string> {
    try {
      // Get available tools
      const tools = await this.toolExecutor.getAvailableTools();
      
      // Get current editor context
      const editorContext = await this.getEditorContext();
      
      // Generate tool usage instructions
      const toolUsagePrompt = this.toolExecutor.generateToolUsagePrompt(tools);
      
      // Combine all parts into a comprehensive prompt
      const enhancedPrompt = [
        "You are an AI programming assistant with access to VS Code and various tools.",
        "You can help the user by using the available tools to perform actions.",
        "",
        "Current context:",
        editorContext,
        "",
        toolUsagePrompt,
        "",
        "User request:",
        basePrompt
      ].join("\n");
      
      return enhancedPrompt;
    } catch (error) {
      this.logger.error(`Failed to generate enhanced prompt: ${error}`);
      return basePrompt;
    }
  }
  
  /**
   * Get the current editor context
   */
  private async getEditorContext(): Promise<string> {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      return "No active editor.";
    }
    
    try {
      const document = editor.document;
      const fileName = document.fileName.split('/').pop() || document.fileName;
      const fileType = document.languageId;
      const selection = editor.selection;
      
      const contextLines = [];
      contextLines.push(`Current file: ${fileName} (${fileType})`);
      
      // Add selection context if there is a selection
      if (!selection.isEmpty) {
        const selectedText = document.getText(selection);
        contextLines.push(`Selected text (${selection.start.line + 1}:${selection.start.character + 1} to ${selection.end.line + 1}:${selection.end.character + 1}):`);
        contextLines.push("```");
        contextLines.push(selectedText);
        contextLines.push("```");
      } else {
        // If no selection, provide current line for context
        const cursorPosition = selection.active;
        const currentLine = document.lineAt(cursorPosition.line).text;
        contextLines.push(`Current line (${cursorPosition.line + 1}:${cursorPosition.character + 1}):`);
        contextLines.push("```");
        contextLines.push(currentLine);
        contextLines.push("```");
      }
      
      // Get document analysis if available
      try {
        const analysis = await this.codeAnalyzer.analyzeDocument(document);
        if (analysis && analysis.summary) {
          contextLines.push("");
          contextLines.push("Document analysis:");
          contextLines.push(analysis.summary);
        }
      } catch (error) {
        // Ignore analysis errors in context building
      }
      
      return contextLines.join("\n");
    } catch (error) {
      this.logger.error(`Error getting editor context: ${error}`);
      return "Could not retrieve editor context.";
    }
  }
  
  /**
   * Process an LLM response to extract and execute tool calls
   * Similar to how Copilot processes tool calls from its models
   */
  public async processLLMResponse(llmResponse: string): Promise<string> {
    try {
      // Extract tool calls from the LLM response
      const toolCalls = this.toolExecutor.extractToolCalls(llmResponse);
      
      if (toolCalls.length === 0) {
        // No tool calls found, return the original response
        return llmResponse;
      }
      
      this.logger.info(`Extracted ${toolCalls.length} tool calls from LLM response`);
      
      // Execute each tool call
      const toolResults = [];
      for (const toolCall of toolCalls) {
        try {
          const result = await this.toolExecutor.handleToolCall(toolCall);
          toolResults.push(result);
          
          // Emit tool executed event
          this._onToolExecuted.fire({
            tool: toolCall.tool,
            params: toolCall.parameters || {},
            result: result.result
          });
        } catch (error) {
          toolResults.push({
            tool: toolCall.tool,
            error: `Tool execution failed: ${error}`
          });
        }
      }
      
      // Format tool results
      const resultTexts = toolResults.map(result => {
        const toolName = result.tool;
        if (result.error) {
          return `Tool: ${toolName}\nError: ${result.error}\n`;
        } else {
          const resultText = typeof result.result === 'object' 
            ? JSON.stringify(result.result, null, 2)
            : String(result.result);
          return `Tool: ${toolName}\nResult:\n${resultText}\n`;
        }
      });
      
      // Replace the tool calls in the original response with the results
      let processedResponse = llmResponse;
      
      // Add a section with tool results at the end
      processedResponse += "\n\n## Tool Execution Results\n\n";
      processedResponse += resultTexts.join("\n");
      
      return processedResponse;
    } catch (error) {
      this.logger.error(`Error processing LLM response: ${error}`);
      return llmResponse;
    }
  }
  
  /**
   * Augment a text completion request with tool capabilities
   */
  public async augmentCompletionRequest(
    prompt: string, 
    options: any
  ): Promise<{prompt: string, options: any}> {
    try {
      // Enhance the prompt with tool context
      const enhancedPrompt = await this.generateEnhancedPrompt(prompt);
      
      // Get available tools in JSON Schema format for LLMs that support function calling
      const tools = await this.toolExecutor.getAvailableTools();
      const toolSchemas = this.toolExecutor.convertToolsToJSONSchema(tools);
      
      // Augment options with tool schemas if the LLM supports it
      const augmentedOptions = {
        ...options,
        tools: toolSchemas,
        tool_choice: tools.length > 0 ? "auto" : "none"
      };
      
      return {
        prompt: enhancedPrompt,
        options: augmentedOptions
      };
    } catch (error) {
      this.logger.error(`Error augmenting completion request: ${error}`);
      return { prompt, options };
    }
  }
  
  /**
   * Execute a tool by name
   */
  public async executeTool(
    toolName: string, 
    params: Record<string, any>
  ): Promise<any> {
    try {
      const result = await this.toolExecutor.executeTool(toolName, params);
      
      // Emit tool executed event
      this._onToolExecuted.fire({ tool: toolName, params, result });
      
      return result;
    } catch (error) {
      this.logger.error(`Error executing tool ${toolName}: ${error}`);
      throw error;
    }
  }
  
  /**
   * Dispose of resources
   */
  public dispose(): void {
    // Dispose all disposables
    for (const disposable of this.disposables) {
      disposable.dispose();
    }
    this.disposables = [];
    
    // Dispose emitters
    this._onToolExecuted.dispose();
    
    // Dispose MCP manager
    this.mcpManager.dispose();
  }
}
