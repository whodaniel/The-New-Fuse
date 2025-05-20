import React, { useState, useEffect } from 'react';
import Editor from '@monaco-editor/react';
export const CodeEditor = ({ value, onChange, language = 'json', height = '200px', }) => {
    const [editorValue, setEditorValue] = useState('');
    useEffect(() => {
        try {
            const formattedValue = typeof value === 'string'
                ? value
                : JSON.stringify(value, null, 2);
            setEditorValue(formattedValue);
        }
        catch (e) {
            setEditorValue('');
        }
    }, [value]);
    const handleEditorChange = (newValue) => {
        if (!newValue)
            return;
        setEditorValue(newValue);
        try {
            if (language === 'json') {
                const parsed = JSON.parse(newValue);
                onChange(parsed);
            }
            else {
                onChange(newValue);
            }
        }
        catch (e) {
        }
    };
    return (<div className="code-editor">
      <Editor height={height} language={language} value={editorValue} onChange={handleEditorChange} options={{
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            automaticLayout: true,
            fontSize: 12,
            lineNumbers: 'on',
            roundedSelection: false,
            scrollbar: {
                vertical: 'visible',
                horizontal: 'visible',
            },
            lineHeight: 19,
            glyphMargin: false,
            folding: true,
            renderLineHighlight: 'line',
            theme: 'vs-light',
        }}/>
    </div>);
};
//# sourceMappingURL=CodeEditor.js.map