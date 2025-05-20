import * as vscode from 'vscode';

/**
 * Anthropic XML function call utilities
 * 
 * These utilities help with parsing and creating XML function calls for Anthropic models
 */

/**
 * Parse an Anthropic XML function call
 * 
 * @param xmlString The XML string to parse
 * @returns The parsed function call object
 */
export function parseXmlFunctionCall(xmlString: string): any {
  try {
    // Extract function name
    const functionNameMatch = xmlString.match(/<invoke name="([^"]+)">/);
    if (!functionNameMatch) {
      throw new Error('Function name not found in XML');
    }
    const functionName = functionNameMatch[1];
    
    // Extract parameters
    const parameters: Record<string, any> = {};
    const paramRegex = /<parameter name="([^"]+)">([^<]+)<\/antml:parameter>/g;
    let match;
    
    while ((match = paramRegex.exec(xmlString)) !== null) {
      const [_, paramName, paramValue] = match;
      
      // Try to parse as JSON if it looks like a JSON value
      try {
        if (
          (paramValue.startsWith('{') && paramValue.endsWith('}')) ||
          (paramValue.startsWith('[') && paramValue.endsWith(']')) ||
          paramValue === 'true' ||
          paramValue === 'false' ||
          !isNaN(Number(paramValue))
        ) {
          parameters[paramName] = JSON.parse(paramValue);
        } else {
          parameters[paramName] = paramValue;
        }
      } catch (e) {
        // If parsing fails, use the raw string
        parameters[paramName] = paramValue;
      }
    }
    
    return {
      name: functionName,
      parameters
    };
  } catch (error) {
    console.error('Error parsing XML function call:', error);
    throw error;
  }
}

/**
 * Create an Anthropic XML function call
 * 
 * @param functionName The name of the function
 * @param parameters The parameters for the function
 * @returns The XML function call string
 */
export function createXmlFunctionCall(functionName: string, parameters: Record<string, any>): string {
  try {
    let xml = `<function_calls>\n<invoke name="${functionName}">\n`;
    
    for (const [paramName, paramValue] of Object.entries(parameters)) {
      const stringValue = typeof paramValue === 'object' 
        ? JSON.stringify(paramValue) 
        : String(paramValue);
      
      xml += `<parameter name="${paramName}">${stringValue}
