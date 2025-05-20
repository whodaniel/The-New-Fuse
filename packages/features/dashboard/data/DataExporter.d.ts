import { DataExportOptions } from '../types/dataExport.js';
interface DataExportOptions {
    format: csv' | 'json' | 'xml';
    startDate?: Date;
    endDate?: Date;
}
export declare class DataExporter {
    private data;
    constructor(data: unknown);
    export(options: DataExportOptions): string;
    default: throw;
}
export {};
