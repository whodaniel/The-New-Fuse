"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TextProcessorNodeExecutor = void 0;
import types_1 from '../types.js';
class TextProcessorNodeExecutor {
}
() => ;
(node) => {
    const { operation } = node.data;
    if (!operation) {
        throw new types_1.WorkflowError('Operation is required', node.id);
    }
    switch (operation) {
        case 'split':
            if (!node.data.splitOptions) {
                throw new types_1.WorkflowError('Split options are required', node.id);
            }
            break;
        case 'clean':
            if (!node.data.cleanOptions) {
                throw new types_1.WorkflowError('Clean options are required', node.id);
            }
            break;
        case 'combine':
            if (!node.data.combineOptions) {
                throw new types_1.WorkflowError('Combine options are required', node.id);
            }
            break;
        default:
            throw new types_1.WorkflowError(`Invalid operation: ${operation}`, node.id);
    }
    return true;
};
async;
execute();
Promise();
Promise(node, context);
{
    const { operation } = node.data;
    const { inputs, logger } = context;
    logger.debug('Executing text processor node', { nodeId: node.id, operation });
    try {
        let text = inputs.text;
        if (!text) {
            throw new Error('Input text is required');
        }
        switch (operation) {
            case 'split':
                return this.executeSplit(text, node.data.splitOptions);
            case 'clean':
                return this.executeClean(text, node.data.cleanOptions);
            case 'combine':
                return this.executeCombine(text, node.data.combineOptions);
            default:
                throw new Error(`Invalid operation: ${operation}`);
        }
    }
    catch (error) {
        logger.error('Text processor node execution failed', error, { nodeId: node.id });
        throw error;
    }
}
async;
executeSplit();
Promise();
Promise(text, options);
{
    const { chunkSize, overlap, splitBy } = options;
    let chunks = [];
    switch (splitBy) {
        case 'character':
            for (let i = 0; i < text.length; i += chunkSize - overlap) {
                chunks.push(text.slice(i, i + chunkSize));
            }
            break;
        case 'token':
            // Simple word-based splitting (in practice, use a proper tokenizer)
            const words = text.split(/\s+/);
            for (let i = 0; i < words.length; i += chunkSize - overlap) {
                chunks.push(words.slice(i, i + chunkSize).join(' '));
            }
            break;
        case 'sentence':
            const sentences = text.match(/[^.!?]+[.!?]+/g) || [];
            for (let i = 0; i < sentences.length; i += chunkSize - overlap) {
                chunks.push(sentences.slice(i, i + chunkSize).join(' '));
            }
            break;
    }
    return { chunks };
}
async;
executeClean();
Promise();
Promise(text, options);
{
    const { removeHtml, removeMarkdown, normalizeWhitespace, customRegex } = options;
    let cleaned = text;
    if (removeHtml) {
        cleaned = cleaned.replace(/<[^>]*>/g, '');
    }
    if (removeMarkdown) {
        // Simple markdown removal (in practice, use a proper markdown parser)
        cleaned = cleaned
            .replace(/[*_~`]|#{1,6}\s/g, '')
            .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
    }
    if (normalizeWhitespace) {
        cleaned = cleaned.replace(/\s+/g, ' ').trim();
    }
    if (customRegex) {
        try {
            const regex = new RegExp(customRegex, 'g');
            cleaned = cleaned.replace(regex, '');
        }
        catch (error) {
            throw new Error(`Invalid regex pattern: ${customRegex}`);
        }
    }
    return { text: cleaned };
}
async;
executeCombine();
Promise();
Promise(text, options);
{
    const { separator, maxLength } = options;
    let combined;
    if (Array.isArray(text)) {
        combined = text.join(separator || '\n\n');
    }
    else {
        combined = text;
    }
    if (maxLength && combined.length > maxLength) {
        combined = combined.slice(0, maxLength);
    }
    return { text: combined };
}
async;
cleanup();
Promise();
Promise();
{
    // No cleanup needed for text processor nodes
}
exports.TextProcessorNodeExecutor = TextProcessorNodeExecutor;
export {};
//# sourceMappingURL=text-processor.js.map