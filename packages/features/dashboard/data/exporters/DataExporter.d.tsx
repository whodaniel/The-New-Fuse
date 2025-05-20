import { ExportMetadata } from './types.js';
import 'jspdf-autotable';
export declare class DataExporter {
    private metadata?;
    constructor(metadata?: ExportMetadata);
    export(): Promise<void>;
}
