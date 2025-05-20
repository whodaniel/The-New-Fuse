import * as vscode from 'vscode';
import { getLogger } from '../core/logging.js';
import { LanguageModelAccessInformation } from '../types/mcp.js';

export async function verifyLLMAccess(context: vscode.ExtensionContext): Promise<boolean> {
    const logger = getLogger();

    try {
        // Create a properly typed default
        const defaultInfo: LanguageModelAccessInformation = {
            authenticated: false,
            hasAccess: false,
            subscriptionStatus: 'none',
            capabilities: []
        };
        
        // Get language model access information from context or use default
        // Using type assertion to avoid type error
        const accessInfo = (context.languageModelAccessInformation || defaultInfo) as LanguageModelAccessInformation;
 
        if (!accessInfo.authenticated || !accessInfo.hasAccess) {
            logger.warn('Language model access not authenticated or granted');
            return false;
        }
 
        // Check subscription status - handle both string and object formats
        const subscriptionActive = typeof accessInfo.subscriptionStatus === 'string' 
            ? accessInfo.subscriptionStatus === 'subscribed' || accessInfo.subscriptionStatus === 'active'
            : (accessInfo.subscriptionStatus as { isSubscribed?: boolean })?.isSubscribed === true;
 
        if (!subscriptionActive) {
            logger.warn('No active subscription for language model access');
            return false;
        }
 
        // Make sure capabilities array exists before checking length
        if (!accessInfo.capabilities || accessInfo.capabilities.length === 0) {
            logger.warn('No capabilities available for language model access');
            return false;
        }
 
        logger.info('Language model access verified');
        return true;
    } catch (error) {
        logger.error('Failed to verify LLM access:', error);
        return false;
    }
}
