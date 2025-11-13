import React from 'react';
interface MonacoEditorProps {
    value: string;
    language?: string;
    onChange?: (value: string) => void;
    readOnly?: boolean;
    height?: string;
    width?: string;
    className?: string;
    options?: any;
}
declare const MonacoEditor: React.FC<MonacoEditorProps>;
export { MonacoEditor };
//# sourceMappingURL=MonacoEditor.d.ts.map