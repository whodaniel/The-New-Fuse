import { Node, NodeConfig, NodeInput, NodeOutput } from './types.js';
import { DocumentProcessor } from './document-processor.js';
import { ApiUsageTracker } from './api-usage-tracker.js';

export interface DocumentProcessingNodeConfig extends NodeConfig {
  operation: 'parse' | 'extract' | 'summarize' | 'convert' | 'ocr' | 'translate' | 'split';
  outputFormat?: 'text' | 'json' | 'markdown' | 'html';
  extractionRules?: Record<string, string>;
  summarizationLength?: number;
  convertTo?: 'pdf' | 'docx' | 'txt' | 'html' | 'markdown';
  ocrLanguage?: string;
  translateTo?: string;
  splitMethod?: 'chunk' | 'sentence' | 'paragraph';
  chunkSize?: number;
  chunkOverlap?: number;
}

export class DocumentProcessingNode implements Node {
  id: string;
  type: string = 'documentProcessing';
  name: string;
  config: DocumentProcessingNodeConfig;
  private processor: DocumentProcessor;
  private apiUsageTracker?: ApiUsageTracker;
  
  constructor(
    id: string, 
    name: string, 
    config: DocumentProcessingNodeConfig, 
    processor: DocumentProcessor,
    apiUsageTracker?: ApiUsageTracker
  ) {
    this.id = id;
    this.name = name;
    this.config = config;
    this.processor = processor;
    this.apiUsageTracker = apiUsageTracker;
  }
  
  async execute(inputs: NodeInput): Promise<NodeOutput> {
    try {
      if (!inputs.data?.document && !inputs.data?.documentUrl && !inputs.data?.text) {
        return { 
          success: false, 
          error: 'No document, document URL, or text provided for processing' 
        };
      }
      
      let result;
      
      switch (this.config.operation) {
        case 'parse':
          result = await this.parseDocument(inputs);
          break;
        case 'extract':
          result = await this.extractFromDocument(inputs);
          break;
        case 'summarize':
          result = await this.summarizeDocument(inputs);
          break;
        case 'convert':
          result = await this.convertDocument(inputs);
          break;
        case 'ocr':
          result = await this.ocrDocument(inputs);
          break;
        case 'translate':
          result = await this.translateDocument(inputs);
          break;
        case 'split':
          result = await this.splitDocument(inputs);
          break;
        default:
          return {
            success: false,
            error: `Unsupported operation: ${this.config.operation}`
          };
      }
      
      // Track API usage if tracker is provided
      if (this.apiUsageTracker) {
        await this.apiUsageTracker.trackUsage({
          userId: inputs.userId,
          endpoint: `document/${this.config.operation}`,
          timestamp: new Date(),
          success: result.success,
          nodeId: this.id,
          workflowId: inputs.workflowId,
          serviceProvider: 'document-processor'
        });
      }
      
      return result;
    } catch (error) {
      // Track error if tracker is provided
      if (this.apiUsageTracker) {
        await this.apiUsageTracker.trackUsage({
          userId: inputs.userId,
          endpoint: `document/${this.config.operation}`,
          timestamp: new Date(),
          success: false,
          nodeId: this.id,
          workflowId: inputs.workflowId,
          serviceProvider: 'document-processor'
        });
      }
      
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  private async parseDocument(inputs: NodeInput): Promise<NodeOutput> {
    const result = await this.processor.parseDocument(
      inputs.data.document || inputs.data.documentUrl,
      this.config.outputFormat || 'text'
    );
    
    return {
      success: true,
      data: { parsedContent: result }
    };
  }
  
  private async extractFromDocument(inputs: NodeInput): Promise<NodeOutput> {
    if (!this.config.extractionRules) {
      return {
        success: false,
        error: 'No extraction rules defined'
      };
    }
    
    const result = await this.processor.extractFromDocument(
      inputs.data.document || inputs.data.documentUrl || inputs.data.text,
      this.config.extractionRules
    );
    
    return {
      success: true,
      data: result
    };
  }
  
  private async summarizeDocument(inputs: NodeInput): Promise<NodeOutput> {
    const result = await this.processor.summarizeDocument(
      inputs.data.document || inputs.data.documentUrl || inputs.data.text,
      this.config.summarizationLength || 200
    );
    
    return {
      success: true,
      data: { summary: result }
    };
  }
  
  private async convertDocument(inputs: NodeInput): Promise<NodeOutput> {
    if (!this.config.convertTo) {
      return {
        success: false,
        error: 'No target format specified for conversion'
      };
    }
    
    const result = await this.processor.convertDocument(
      inputs.data.document || inputs.data.documentUrl,
      this.config.convertTo
    );
    
    return {
      success: true,
      data: { convertedDocument: result }
    };
  }

  private async ocrDocument(inputs: NodeInput): Promise<NodeOutput> {
    const result = await this.processor.performOcr(
      inputs.data.document || inputs.data.documentUrl,
      this.config.ocrLanguage
    );
    
    return {
      success: true,
      data: { extractedText: result }
    };
  }
  
  private async translateDocument(inputs: NodeInput): Promise<NodeOutput> {
    if (!this.config.translateTo) {
      return {
        success: false,
        error: 'No target language specified for translation'
      };
    }
    
    const result = await this.processor.translateDocument(
      inputs.data.document || inputs.data.documentUrl || inputs.data.text,
      this.config.translateTo
    );
    
    return {
      success: true,
      data: { translatedText: result }
    };
  }
  
  private async splitDocument(inputs: NodeInput): Promise<NodeOutput> {
    const result = await this.processor.splitDocument(
      inputs.data.document || inputs.data.documentUrl || inputs.data.text,
      this.config.splitMethod || 'chunk',
      this.config.chunkSize || 1000,
      this.config.chunkOverlap || 200
    );
    
    return {
      success: true,
      data: { chunks: result }
    };
  }
}
