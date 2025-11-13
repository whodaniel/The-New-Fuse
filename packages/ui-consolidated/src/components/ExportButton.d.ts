import React from 'react';
export type ExportFormat = 'pdf' | 'md' | 'txt';
export interface ExportButtonProps {
    conversation: string;
    format?: ExportFormat;
    apiUrl?: string;
    buttonLabel?: string;
}
export declare const ExportButton: React.FC<ExportButtonProps>;
//# sourceMappingURL=ExportButton.d.ts.map