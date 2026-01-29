import { DataExportOptions } from '../types/dataExport';

export class DataExporter {
  private data: any[];

  constructor(data: any[]) {
    this.data = data;
  }

  public export(options: DataExportOptions): string {
    switch (options.format) {
      case 'csv':
        return this.toCSV(options);
      case 'json':
        return this.toJSON(options);
      case 'xml':
        return this.toXML(options);
      default:
        throw new Error('Unsupported format');
    }
  }

  private toCSV(options: DataExportOptions): string {
    const filteredData = this.filterData(options);
    if (filteredData.length === 0) return '';

    const headers = Object.keys(filteredData[0]);
    const rows = filteredData.map((row) =>
      headers.map((header) => JSON.stringify(row[header])).join(',')
    );

    return [headers.join(','), ...rows].join('\n');
  }

  private toJSON(options: DataExportOptions): string {
    const filteredData = this.filterData(options);
    return JSON.stringify(filteredData, null, 2);
  }

  private toXML(options: DataExportOptions): string {
    const filteredData = this.filterData(options);
    const rows = filteredData.map((row) => {
      const fields = Object.entries(row)
        .map(([key, value]) => `<${key}>${value}</${key}>`)
        .join('');
      return `<item>${fields}</item>`;
    });
    return `<data>${rows.join('')}</data>`;
  }

  private filterData(options: DataExportOptions): any[] {
    let filtered = [...this.data];
    if (options.startDate) {
      filtered = filtered.filter((item) => new Date(item.date) >= options.startDate!);
    }
    if (options.endDate) {
      filtered = filtered.filter((item) => new Date(item.date) <= options.endDate!);
    }
    return filtered;
  }
}
