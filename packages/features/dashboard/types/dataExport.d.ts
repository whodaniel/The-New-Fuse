export interface DataExportOptions {
    format: csv' | 'json' | 'xml';
    includeSensitiveData: boolean;
    startDate?: Date;
    endDate?: Date;
}
