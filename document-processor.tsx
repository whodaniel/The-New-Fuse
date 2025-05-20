import axios from 'axios';

type OutputFormat = 'text' | 'json' | 'markdown' | 'html';
type ConvertFormat = 'pdf' | 'docx' | 'txt' | 'html' | 'markdown';
type SplitMethod = 'chunk' | 'sentence' | 'paragraph';

export class DocumentProcessor {
  private baseUrl: string;
  private apiKey?: string;
  
  constructor(baseUrl?: string, apiKey?: string) {
    this.baseUrl = baseUrl || process.env.DOCUMENT_API_URL || 'http://localhost:8080/api';
    this.apiKey = apiKey || process.env.DOCUMENT_API_KEY;
  }
  
  private getHeaders() {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };
    
    if (this.apiKey) {
      headers['Authorization'] = `Bearer ${this.apiKey}`;
    }
    
    return headers;
  }
  
  private async uploadDocument(document: Buffer | string): Promise<string> {
    const formData = new FormData();
    
    if (typeof document === 'string') {
      // If document is a URL
      if (document.startsWith('http')) {
        return document;
      }
      
      // If document is base64 encoded
      const buffer = Buffer.from(document, 'base64');
      const blob = new Blob([buffer]);
      formData.append('file', blob);
    } else {
      // If document is a Buffer
      const blob = new Blob([document]);
      formData.append('file', blob);
    }
    
    const response = await axios.post(
      `${this.baseUrl}/documents/upload`,
      formData,
      {
        headers: {
          ...this.getHeaders(),
          'Content-Type': 'multipart/form-data'
        }
      }
    );
    
    return response.data.documentId;
  }
  
  async parseDocument(
    document: Buffer | string,
    outputFormat: OutputFormat = 'text'
  ): Promise<string> {
    try {
      const documentId = await this.uploadDocument(document);
      
      const response = await axios.post(
        `${this.baseUrl}/documents/parse`,
        {
          documentId,
          outputFormat
        },
        { headers: this.getHeaders() }
      );
      
      return response.data.content;
    } catch (error) {
      console.error('Failed to parse document:', error);
      throw error;
    }
  }
  
  async extractFromDocument(
    document: Buffer | string,
    extractionRules: Record<string, string>
  ): Promise<Record<string, any>> {
    try {
      const documentId = await this.uploadDocument(document);
      
      const response = await axios.post(
        `${this.baseUrl}/documents/extract`,
        {
          documentId,
          extractionRules
        },
        { headers: this.getHeaders() }
      );
      
      return response.data.extracted;
    } catch (error) {
      console.error('Failed to extract from document:', error);
      throw error;
    }
  }
  
  async summarizeDocument(
    document: Buffer | string,
    maxLength: number = 200
  ): Promise<string> {
    try {
      const documentId = await this.uploadDocument(document);
      
      const response = await axios.post(
        `${this.baseUrl}/documents/summarize`,
        {
          documentId,
          maxLength
        },
        { headers: this.getHeaders() }
      );
      
      return response.data.summary;
    } catch (error) {
      console.error('Failed to summarize document:', error);
      throw error;
    }
  }
  
  async convertDocument(
    document: Buffer | string,
    targetFormat: ConvertFormat
  ): Promise<Buffer> {
    try {
      const documentId = await this.uploadDocument(document);
      
      const response = await axios.post(
        `${this.baseUrl}/documents/convert`,
        {
          documentId,
          targetFormat
        },
        {
          headers: this.getHeaders(),
          responseType: 'arraybuffer'
        }
      );
      
      return Buffer.from(response.data);
    } catch (error) {
      console.error('Failed to convert document:', error);
      throw error;
    }
  }
  
  async performOcr(
    document: Buffer | string,
    language?: string
  ): Promise<string> {
    try {
      const documentId = await this.uploadDocument(document);
      
      const response = await axios.post(
        `${this.baseUrl}/documents/ocr`,
        {
          documentId,
          language
        },
        { headers: this.getHeaders() }
      );
      
      return response.data.text;
    } catch (error) {
      console.error('Failed to perform OCR on document:', error);
      throw error;
    }
  }
  
  async translateDocument(
    document: Buffer | string,
    targetLanguage: string
  ): Promise<string> {
    try {
      const documentId = await this.uploadDocument(document);
      
      const response = await axios.post(
        `${this.baseUrl}/documents/translate`,
        {
          documentId,
          targetLanguage
        },
        { headers: this.getHeaders() }
      );
      
      return response.data.translatedText;
    } catch (error) {
      console.error('Failed to translate document:', error);
      throw error;
    }
  }
  
  async splitDocument(
    document: Buffer | string,
    method: SplitMethod = 'chunk',
    chunkSize: number = 1000,
    chunkOverlap: number = 200
  ): Promise<string[]> {
    try {
      const documentId = await this.uploadDocument(document);
      
      const response = await axios.post(
        `${this.baseUrl}/documents/split`,
        {
          documentId,
          method,
          chunkSize,
          chunkOverlap
        },
        { headers: this.getHeaders() }
      );
      
      return response.data.chunks;
    } catch (error) {
      console.error('Failed to split document:', error);
      throw error;
    }
  }
}
