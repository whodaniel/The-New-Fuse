import { Injectable, Logger } from '@nestjs/common';
import { DocumentSource, ContentExtractor } from '../types';
import * as pdf from 'pdf-parse';

@Injectable()
export class PdfExtractor implements ContentExtractor {
  private readonly logger = new Logger(PdfExtractor.name);
  public readonly format = 'pdf';

  async extract(source: DocumentSource): Promise<string> {
    this.logger.debug('Extracting content from PDF document');
    
    try {
      if (!this.canExtract(source)) {
        throw new Error('Invalid PDF document source');
      }

      let dataBuffer: Buffer;
      
      if (source.buffer) {
        dataBuffer = source.buffer;
      } else if (source.filePath) {
        const fs = await import('fs');
        dataBuffer = await fs.promises.readFile(source.filePath);
      } else if (source.url) {
        const response = await fetch(source.url);
        const arrayBuffer = await response.arrayBuffer();
        dataBuffer = Buffer.from(arrayBuffer);
      } else {
        throw new Error('No valid PDF source provided');
      }

      const data = await pdf(dataBuffer);
      this.logger.debug(`Extracted ${data.text.length} characters from PDF`);
      
      return data.text;
    } catch (error) {
      this.logger.error('Error extracting PDF content:', error);
      throw new Error(`PDF extraction failed: ${error.message}`);
    }
  }

  canExtract(source: DocumentSource): boolean {
    return source.type === 'pdf' || source.mimeType === 'application/pdf';
  }
}