import { PDFExtract } from 'pdf.js-extract';
import { ContentExtractor, DocumentSource } from '../types.js';

export class PdfExtractor implements ContentExtractor {
  public readonly format = 'pdf';
  private pdfExtract: PDFExtract;
  
  constructor() {
    this.pdfExtract = new PDFExtract();
  }
  
  async extract(source: DocumentSource): Promise<string> {
    if (!source.content && !source.path) {
      throw new Error('PDF source must contain either content buffer or file path');
    }
    
    try {
      let data;
      
      if (source.path) {
        data = await this.pdfExtract.extract(source.path);
      } else if (source.content) {
        // Convert Buffer to ArrayBuffer for pdf.js
        const arrayBuffer = source.content.buffer.slice(
          source.content.byteOffset, 
          source.content.byteOffset + source.content.byteLength
        );
        
        data = await this.pdfExtract.extractBuffer(arrayBuffer);
      } else {
        throw new Error('No content or path provided');
      }
      
      // Combine all page text
      const text = data.pages
        .map(page => 
          page.content
            .sort((a, b) => {
              // Sort by y position first (rows), then x position (columns)
              const yDiff = a.y - b.y;
              if (Math.abs(yDiff) > 5) return yDiff; // 5 is a threshold for the same line
              return a.x - b.x;
            })
            .map(item => item.str)
            .join(' ')
        )
        .join('\n\n');
      
      return text;
    } catch (error) {
      throw new Error(`Error extracting PDF content: ${error.message}`);
    }
  }
}
