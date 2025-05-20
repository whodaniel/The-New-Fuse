import React, { useRef, useEffect, useState } from 'react';
import * as monaco from 'monaco-editor';
import { cn } from '@/lib/utils';

export interface MonacoEditorProps {
  value: string;
  language?: string;
  theme?: 'vs' | 'vs-dark' | 'hc-black';
  options?: monaco.editor.IStandaloneEditorConstructionOptions;
  onChange?: (value: string) => void;
  onMount?: (editor: monaco.editor.IStandaloneCodeEditor) => void;
  className?: string;
  height?: string | number;
  width?: string | number;
  readOnly?: boolean;
}

export const MonacoEditor: React.FC<MonacoEditorProps> = ({
  value,
  language = 'javascript',
  theme = 'vs-dark',
  options = {},
  onChange,
  onMount,
  className,
  height = '500px',
  width = '100%',
  readOnly = false,
}) => {
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isEditorReady, setIsEditorReady] = useState(false);

  // Initialize editor
  useEffect(() => {
    if (containerRef.current && !editorRef.current) {
      const defaultOptions: monaco.editor.IStandaloneEditorConstructionOptions = {
        value,
        language,
        theme,
        automaticLayout: true,
        minimap: { enabled: false },
        scrollBeyondLastLine: false,
        readOnly,
        ...options,
      };

      editorRef.current = monaco.editor.create(
        containerRef.current,
        defaultOptions
      );

      setIsEditorReady(true);

      if (onMount) {
        onMount(editorRef.current);
      }
    }

    return () => {
      if (editorRef.current) {
        editorRef.current.dispose();
        editorRef.current = null;
      }
    };
  }, []);

  // Update editor value when prop changes
  useEffect(() => {
    if (editorRef.current && value !== editorRef.current.getValue()) {
      editorRef.current.setValue(value);
    }
  }, [value]);

  // Update editor language when prop changes
  useEffect(() => {
    if (editorRef.current) {
      monaco.editor.setModelLanguage(editorRef.current.getModel()!, language);
    }
  }, [language]);

  // Update editor theme when prop changes
  useEffect(() => {
    monaco.editor.setTheme(theme);
  }, [theme]);

  // Update editor options when readOnly prop changes
  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.updateOptions({ readOnly });
    }
  }, [readOnly]);

  // Set up onChange handler
  useEffect(() => {
    if (editorRef.current && onChange) {
      const disposable = editorRef.current.onDidChangeModelContent(() => {
        const value = editorRef.current?.getValue() || '';
        onChange(value);
      });

      return () => disposable.dispose();
    }
  }, [onChange, isEditorReady]);

  return (
    <div
      ref={containerRef}
      className={cn('border rounded-md overflow-hidden', className)}
      style={{ height, width }}
    />
  );
};

export default MonacoEditor;
