import React, { useState } from 'react';
import { Box, VStack, Text, HStack, Button, Tooltip } from '@chakra-ui/react';
import MonacoEditor from '@monaco-editor/react';
import { FaQuestionCircle, FaCode, FaMarkdown } from 'react-icons/fa';

interface PromptEditorProps {
  prompt: string;
  onChange: (prompt: string) => void;
}

export const PromptEditor: React.React.FC<PromptEditorProps> = ({ prompt, onChange }) => {
  const [editorMode, setEditorMode] = useState<'plain' | 'markdown' | 'json'>('plain');

  const handleEditorChange = (value: string | undefined) => {
    onChange(value || '');
  };

  const getLanguage = () => {
    switch (editorMode) {
      case 'markdown': return 'markdown';
      case 'json': return 'json';
      default: return 'plaintext';
    }
  };

  const getPromptTemplateHelp = () => (
    <Box p={3} fontSize="sm">
      <Text fontWeight="bold" mb={2}>Template Variables</Text>
      <Text>Use <code>{'{{variable_name}}'}</code> syntax for variables.</Text>
      <Text mt={2}>Example: <code>Hello, my name is {{name}} and I am {{age}} years old.</code></Text>
      
      <Text fontWeight="bold" mt={4} mb={2}>System Instructions</Text>
      <Text>Start with clear system instructions to define assistant behavior:</Text>
      <Text mt={1}><code>You are a helpful assistant that provides concise answers.</code></Text>
      
      <Text fontWeight="bold" mt={4} mb={2}>Formatting Tips</Text>
      <Text>• Use triple backticks for code blocks</Text>
      <Text>• Use bullet points for lists</Text>
      <Text>• Separate instructions clearly with line breaks</Text>
    </Box>
  );

  return (
    <VStack spacing={4} align="stretch">
      <HStack justifyContent="space-between">
        <Text fontSize="lg" fontWeight="medium">Prompt Template</Text>
        <HStack>
          <Tooltip label="Plain Text" hasArrow>
            <Button
              size="sm"
              variant={editorMode === 'plain' ? 'solid' : 'outline'}
              onClick={() => setEditorMode('plain')}
              aria-label="Plain Text Mode"
            >
              <Text>Text</Text>
            </Button>
          </Tooltip>
          <Tooltip label="Markdown" hasArrow>
            <Button
              size="sm"
              variant={editorMode === 'markdown' ? 'solid' : 'outline'}
              onClick={() => setEditorMode('markdown')}
              aria-label="Markdown Mode"
            >
              <FaMarkdown />
            </Button>
          </Tooltip>
          <Tooltip label="JSON" hasArrow>
            <Button
              size="sm"
              variant={editorMode === 'json' ? 'solid' : 'outline'}
              onClick={() => setEditorMode('json')}
              aria-label="JSON Mode"
            >
              <FaCode />
            </Button>
          </Tooltip>
          <Tooltip label="Prompt Template Help" hasArrow placement="top">
            <Button size="sm" variant="ghost" aria-label="Help">
              <FaQuestionCircle />
            </Button>
          </Tooltip>
        </HStack>
      </HStack>

      <Box border="1px" borderColor="gray.200" borderRadius="md" h="60vh">
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
      </Box>
    </VStack>
  );
};
