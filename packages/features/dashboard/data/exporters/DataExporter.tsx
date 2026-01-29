import { ExportMetadata, ExportOptions } from './types';

export class DataExporter {
  private metadata?: ExportMetadata;

  constructor(metadata?: ExportMetadata) {
    this.metadata = metadata;
  }

  public async export(data: any[], options: ExportOptions): Promise<void> {
    const { format, fileName = 'export' } = options;

    switch (format) {
      case 'csv':
        this.exportCSV(data, fileName);
        break;
      case 'json':
        this.exportJSON(data, fileName);
        break;
      default:
        throw new Error(`Unsupported export format: ${format}`);
    }
  }

  private exportCSV(data: any[], fileName: string): void {
    if (data.length === 0) return;
    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map((row) => headers.map((h) => JSON.stringify(row[h])).join(',')),
    ].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${fileName}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  private exportJSON(data: any[], fileName: string): void {
    const jsonContent = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${fileName}.json`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}
