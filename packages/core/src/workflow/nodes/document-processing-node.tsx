import { NodeHandler, WorkflowNode, ExecutionContext } from '../types.js';
import { DocumentProcessor } from '../../document-processing/document-processor.js';
import { ProcessingOptions } from '../../document-processing/types.js';

export class DocumentProcessingNodeHandler implements NodeHandler {
  private documentProcessor: DocumentProcessor;
  
  constructor({ documentProcessor }: { documentProcessor: DocumentProcessor }) {
    this.documentProcessor = documentProcessor;
  }
  
  async execute(node: WorkflowNode, context: ExecutionContext): Promise<Record<string, any>> {
    const {
      source,
      options = {}
    } = node.data;
    
    context.logger.debug(`Executing document processing node: ${node.id}`, {
      sourceType: source.type,
      sourceName: source.name || 'unnamed'
    });
    
    try {
      // Prepare source object
      const documentSource = {
        name: source.name,
        content: source.content,
        path: source.path,
        url: source.url,
        format: source.format,
        mimeType: source.mimeType,
        filename: source.filename,
        metadata: source.metadata || {}
      };
      
      // Prepare processing options
      const processingOptions: ProcessingOptions = {
        chunkingStrategy: options.chunkingStrategy || 'default',
        metadata: options.metadata || {}
      };
      
      // If a pipeline was specified, add it to the options
      if (options.pipeline && Array.isArray(options.pipeline)) {
        processingOptions.pipeline = options.pipeline;
      }
      
      // Process the document
      const result = await this.documentProcessor.processDocument(documentSource, processingOptions);
      
      return {
        success: true,
        sourceDocument: {
          name: result.sourceDocument.name,
          format: result.sourceDocument.format,
          mimeType: result.sourceDocument.mimeType,
          metadata: result.sourceDocument.metadata
        },
        chunks: result.chunks,
        metadata: result.metadata,
        chunkCount: result.chunks.length,
        processingTime: result.metadata.processingTime
      };
    } catch (error) {
      context.logger.error(`Document processing error: ${error.message}`);
      
      return {
        success: false,
        error: error.message
      };
    }
  }
}
