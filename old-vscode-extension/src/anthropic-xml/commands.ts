import * as vscode from 'vscode';
import { parseXmlFunctionCall, createXmlFunctionCall } from './xml-function-call.js';

/**
 * Register Anthropic XML function call commands
 * 
 * @param context The extension context
 * @returns An array of disposables
 */
export function registerAnthropicXmlCommands(context: vscode.ExtensionContext): vscode.Disposable[] {
  const disposables: vscode.Disposable[] = [];
  
  // Parse XML function call
  disposables.push(
    vscode.commands.registerCommand('thefuse.anthropic.parseXmlFunctionCall', async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        vscode.window.showErrorMessage('No active editor');
        return;
      }
      
      const selection = editor.selection;
      const text = editor.document.getText(selection);
      
      if (!text) {
        vscode.window.showErrorMessage('No text selected');
        return;
      }
      
      try {
        const parsed = parseXmlFunctionCall(text);
        
        // Create a new document with the parsed JSON
        const doc = await vscode.workspace.openTextDocument({
          content: JSON.stringify(parsed, null, 2),
          language: 'json'
        });
        
        await vscode.window.showTextDocument(doc);
      } catch (error) {
        vscode.window.showErrorMessage(`Error parsing XML function call: ${error}`);
      }
    })
  );
  
  // Create XML function call
  disposables.push(
    vscode.commands.registerCommand('thefuse.anthropic.createXmlFunctionCall', async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        vscode.window.showErrorMessage('No active editor');
        return;
      }
      
      const selection = editor.selection;
      const text = editor.document.getText(selection);
      
      if (!text) {
        vscode.window.showErrorMessage('No text selected');
        return;
      }
      
      try {
        // Try to parse the selected text as JSON
        const json = JSON.parse(text);
        
        if (!json.name || !json.parameters) {
          vscode.window.showErrorMessage('Selected JSON must have "name" and "parameters" properties');
          return;
        }
        
        const xml = createXmlFunctionCall(json.name, json.parameters);
        
        // Create a new document with the XML
        const doc = await vscode.workspace.openTextDocument({
          content: xml,
          language: 'xml'
        });
        
        await vscode.window.showTextDocument(doc);
      } catch (error) {
        vscode.window.showErrorMessage(`Error creating XML function call: ${error}`);
      }
    })
  );
  
  // Convert tool to XML format
  disposables.push(
    vscode.commands.registerCommand('thefuse.anthropic.convertToolToXmlFormat', async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        vscode.window.showErrorMessage('No active editor');
        return;
      }
      
      const selection = editor.selection;
      const text = editor.document.getText(selection);
      
      if (!text) {
        vscode.window.showErrorMessage('No text selected');
        return;
      }
      
      try {
        // Try to parse the selected text as JSON
        const tool = JSON.parse(text);
        
        if (!tool.name || !tool.description || !tool.parameters) {
          vscode.window.showErrorMessage('Selected JSON must have "name", "description", and "parameters" properties');
          return;
        }
        
        // Create XML format for Anthropic tool definition
        const xml = `<tool_description>
<name>${tool.name}</name>
<description>${tool.description}</description>
<parameters>
${JSON.stringify(tool.parameters, null, 2)}
</parameters>
</tool_description>`;
        
        // Create a new document with the XML
        const doc = await vscode.workspace.openTextDocument({
          content: xml,
          language: 'xml'
        });
        
        await vscode.window.showTextDocument(doc);
      } catch (error) {
        vscode.window.showErrorMessage(`Error converting tool to XML format: ${error}`);
      }
    })
  );
  
  // Convert selection to XML function call
  disposables.push(
    vscode.commands.registerCommand('thefuse.anthropic.convertSelectionToXmlFunctionCall', async () => {
      const functionName = await vscode.window.showInputBox({
        prompt: 'Enter function name',
        placeHolder: 'function_name'
      });
      
      if (!functionName) {
        return;
      }
      
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        vscode.window.showErrorMessage('No active editor');
        return;
      }
      
      const selection = editor.selection;
      const text = editor.document.getText(selection);
      
      if (!text) {
        vscode.window.showErrorMessage('No text selected');
        return;
      }
      
      try {
        // Try to parse the selected text as JSON
        const parameters = JSON.parse(text);
        
        const xml = createXmlFunctionCall(functionName, parameters);
        
        // Replace the selection with the XML
        await editor.edit(editBuilder => {
          editBuilder.replace(selection, xml);
        });
      } catch (error) {
        vscode.window.showErrorMessage(`Error converting selection to XML function call: ${error}`);
      }
    })
  );
  
  return disposables;
}
