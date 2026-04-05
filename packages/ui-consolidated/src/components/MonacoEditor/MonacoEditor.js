import { jsx as _jsx } from "react/jsx-runtime";
import { useEffect, useRef } from 'react';
import { cn } from '../../lib/utils';
const MonacoEditor = ({ value, language = 'javascript', onChange, readOnly = false, height = '400px', width = '100%', className, options = {}, }) => {
    const editorRef = useRef(null);
    const monacoRef = useRef(null);
    const editorInstanceRef = useRef(null);
    useEffect(() => {
        // Dynamic import to avoid SSR issues
        const loadMonaco = async () => {
            if (!editorRef.current)
                return;
            try {
                // Use dynamic import for monaco-editor
                const monaco = await import('monaco-editor');
                monacoRef.current = monaco;
                // Basic options
                const defaultOptions = {
                    value,
                    language,
                    automaticLayout: true,
                    scrollBeyondLastLine: false,
                    minimap: { enabled: false },
                    readOnly,
                    theme: 'vs-dark',
                    fontSize: 14,
                    ...options,
                };
                // Create editor
                editorInstanceRef.current = monaco.editor.create(editorRef.current, defaultOptions);
                // Add change event listener
                if (onChange) {
                    editorInstanceRef.current.onDidChangeModelContent(() => {
                        onChange(editorInstanceRef.current.getValue());
                    });
                }
            }
            catch (error) {
                console.error('Error loading Monaco Editor:', error);
            }
        };
        loadMonaco();
        // Cleanup
        return () => {
            if (editorInstanceRef.current) {
                editorInstanceRef.current.dispose();
            }
        };
    }, []);
    // Update value if it changes externally
    useEffect(() => {
        if (editorInstanceRef.current) {
            const currentValue = editorInstanceRef.current.getValue();
            if (value !== currentValue) {
                editorInstanceRef.current.setValue(value);
            }
        }
    }, [value]);
    return (_jsx("div", { ref: editorRef, className: cn('border border-gray-300 rounded-md overflow-hidden', className), style: { height, width } }));
};
export { MonacoEditor };
