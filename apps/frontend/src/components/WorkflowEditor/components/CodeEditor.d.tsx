import React from 'react';
interface CodeEditorProps {
    value: any;
    onChange: (value: any) => void;
    language?: string;
    height?: string;
}
export declare const CodeEditor: React.React.FC<CodeEditorProps>;
export {};
