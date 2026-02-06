import MonacoEditor from '@monaco-editor/react';
import React, { useState } from 'react';
import { FaCode, FaMarkdown, FaQuestionCircle } from 'react-icons/fa';

interface PromptEditorProps {
  prompt: string;
  onChange: (prompt: string) => void;
}

export const PromptEditor: React.FC<PromptEditorProps> = ({ prompt, onChange }) => {
  const [editorMode, setEditorMode] = useState<'plain' | 'markdown' | 'json'>('plain');

  const handleEditorChange = (value: string | undefined) => {
    onChange(value || '');
  };

  const getLanguage = () => {
    switch (editorMode) {
      case 'markdown':
        return 'markdown';
      case 'json':
        return 'json';
      default:
        return 'plaintext';
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-900">Prompt Template</h3>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setEditorMode('plain')}
            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
              editorMode === 'plain'
                ? 'bg-gray-800 text-white'
                : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
            title="Plain Text"
          >
            Text
          </button>

          <button
            onClick={() => setEditorMode('markdown')}
            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
              editorMode === 'markdown'
                ? 'bg-gray-800 text-white'
                : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
            title="Markdown"
          >
            <FaMarkdown size={16} />
          </button>

          <button
            onClick={() => setEditorMode('json')}
            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
              editorMode === 'json'
                ? 'bg-gray-800 text-white'
                : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
            title="JSON"
          >
            <FaCode size={16} />
          </button>

          <div className="relative group">
            <button
              className="p-1.5 text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Help"
            >
              <FaQuestionCircle size={18} />
            </button>

            <div className="absolute right-0 top-full mt-2 w-72 p-4 bg-white border border-gray-200 rounded-lg shadow-xl z-10 hidden group-hover:block text-sm">
              <div className="space-y-4">
                <div>
                  <p className="font-bold mb-1">Template Variables</p>
                  <p className="text-gray-600 mb-2">
                    Use <code>{'{{variable_name}}'}</code> syntax for variables.
                  </p>
                  <div className="bg-gray-50 p-2 rounded text-xs border border-gray-100 font-mono">
                    Hello, my name is {'{{ name }}'} and I am {'{{ age }}'} years old.
                  </div>
                </div>

                <div>
                  <p className="font-bold mb-1">System Instructions</p>
                  <p className="text-gray-600 mb-2">Start with clear system instructions:</p>
                  <div className="bg-gray-50 p-2 rounded text-xs border border-gray-100 font-mono">
                    You are a helpful assistant that provides concise answers.
                  </div>
                </div>

                <div>
                  <p className="font-bold mb-1">Formatting Tips</p>
                  <ul className="text-gray-600 list-disc list-inside">
                    <li>Use triple backticks for code blocks</li>
                    <li>Use bullet points for lists</li>
                    <li>Separate instructions clearly</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="h-[60vh] border border-gray-200 rounded-md overflow-hidden bg-white">
        <MonacoEditor
          height="100%"
          language={getLanguage()}
          value={prompt}
          onChange={handleEditorChange}
          options={{
            minimap: { enabled: false },
            lineNumbers: 'on',
            wordWrap: 'on',
            automaticLayout: true,
            fontSize: 14,
            scrollBeyondLastLine: false,
          }}
        />
      </div>
    </div>
  );
};
