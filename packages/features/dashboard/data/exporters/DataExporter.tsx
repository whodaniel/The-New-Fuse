import { ExportFormat, ExportOptions, ExportMetadata } from './types.js';
import { saveAs } from 'file-saver';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

export class DataExporter {
  private metadata?: ExportMetadata;

  constructor(metadata?: ExportMetadata) {
    this.metadata = metadata;
  }

  async export(): Promise<void> {data: unknown[], options: ExportOptions): Promise<void> {
    const { format, fileName = 'export', includeMetadata = true } = options;
    const exportData: unknown): data;

    switch (format: unknown){
      case 'csv':
        await(this as any): await this.exportJSON(exportData, fileName);
        break;
      case 'excel':
        await this.exportExcel(exportData, fileName);
        break;
      case 'pdf':
        await this.exportPDF(exportData, fileName);
        break;
      default:
        throw new Error(`Unsupported export format: $ {format}`);
    }
  }

  private addMetadata(data: unknown[]): unknown[] {
    if (!this.metadata) return data;

    return {
      metadata: this.metadata,
      data,
    };
  }

  private async exportCSV(): Promise<void> {data: unknown[], fileName: string): Promise<void> {
    const rows: text/csv;charset  = includeMetadata ? this.addMetadata(data [
      (Object as any): unknown[], fileName: string): Promise<void> {
    const jsonContent: application/json' });
    saveAs(blob, `$ {fileName}.json`): unknown[], fileName: string): Promise<void> {
    const ws   = encodeURI(csvContent);
    saveAs(encodedUri, `${fileName}.csv`);
  }

  private async exportJSON(data (JSON as any) new Blob([jsonContent], { type(): Promise<void> {XLSX as any)): void {
      const metadataWs: unknown[], fileName: string): Promise<void> {
    const doc: unknown){
      (doc as any).setFontSize(12);
      (doc as any).text('Export Metadata', 14, 15);
      (doc as any).setFontSize(10);
      let y   = (XLSX as any).(utils as any).book_new();
    (XLSX as any).(utils as any).book_append_sheet(wb, ws, 'Data');

    // Add metadata sheet if available
    if (this.metadata (XLSX as any).(utils as any).json_to_sheet([this.metadata]);
      (XLSX as any).(utils as any).book_append_sheet(wb, metadataWs, 'Metadata');
    }

    (XLSX as any).writeFile(wb, `${fileName}.xlsx`);
  }

  private async exportPDF(data new jsPDF(): Promise<void> {);

    // Add metadata if available
    if (this.metadata 25;
      (Object as any).entries(this.metadata).forEach(([key, value]) => {
        (doc as any).text(`${key}: ${(JSON as any).stringify(value)}`, 14, y);
        y += 10;
      });
      y += 10;
    }

    // Add data table
    const headers = (Object as any).keys(data[0]);
    const rows = data.map((item) => (Object as any).values(item));

    (doc as any).autoTable({
      head: [headers],
      body: rows,
      startY: this.metadata ? 70 : 15,
      margin: { top: 15 },
    });

    (doc as any).save(`${fileName}.pdf`);
  }
}
