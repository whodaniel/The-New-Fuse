import React, { useState, useEffect } from 'react';
import {
  Box,
  Flex,
  VStack,
  HStack,
  Heading,
  Text,
  Button,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  useToast,
  Divider,
  useDisclosure,
  Select
} from '@chakra-ui/react';
import { PromptEditor } from './PromptEditor.js';
import { VariableManager } from './VariableManager.js';
import { TestCaseManager } from './TestCaseManager.js';
import { ResultsViewer } from './ResultsViewer.js';
import { VersionHistory } from './VersionHistory.js';
import { PromptSaveModal } from './PromptSaveModal.js';
import { usePromptTemplates } from '../../hooks/usePromptTemplates.js';
import { useModels } from '../../hooks/useModels.js';

export const PromptWorkbench: React.FC = () => {
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { templates, saveTemplate, loadTemplate } = usePromptTemplates();
  const { models, selectedModel, setSelectedModel, generateCompletion } = useModels();
  
  const [prompt, setPrompt] = useState<string>('');
  const [variables, setVariables] = useState<Record<string, string>>({});
  const [testCases, setTestCases] = useState<any[]>([]);
  const [results, setResults] = useState<any[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeTemplate, setActiveTemplate] = useState<string | null>(null);

  const handlePromptChange = (newPrompt: string) => {
    setPrompt(newPrompt);
  };

  const handleVariablesChange = (newVariables: Record<string, string>) => {
    setVariables(newVariables);
  };

  const handleTestCasesChange = (newTestCases: any[]) => {
    setTestCases(newTestCases);
  };

  const compilePrompt = (templateText: string, vars: Record<string, string>) => {
    let compiled = templateText;
    Object.entries(vars).forEach(([key, value]) => {
      compiled = compiled.replace(new RegExp(`{{\\s*${key}\\s*}}`, 'g'), value);
    });
    return compiled;
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast({
        title: 'Empty prompt',
        description: 'Please enter a prompt template',
        status: 'warning',
      });
      return;
    }

    setIsGenerating(true);
    setResults([]);

    try {
      if (testCases.length > 0) {
        // Run against all test cases
        const newResults = [];
        for (const testCase of testCases) {
          const testVars = { ...variables, ...testCase.variables };
          const compiledPrompt = compilePrompt(prompt, testVars);
          
          const result = await generateCompletion(compiledPrompt);
          newResults.push({
            testCase: testCase.name,
            prompt: compiledPrompt,
            result,
            timestamp: new Date().toISOString()
          });
        }
        setResults(newResults);
      } else {
        // Run with current variables
        const compiledPrompt = compilePrompt(prompt, variables);
        const result = await generateCompletion(compiledPrompt);
        setResults([{
          prompt: compiledPrompt,
          result,
          timestamp: new Date().toISOString()
        }]);
      }
      
      toast({
        title: 'Generation complete',
        status: 'success',
      });
    } catch (error) {
      toast({
        title: 'Generation failed',
        description: error.message,
        status: 'error',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSave = () => {
    onOpen();
  };

  const handleTemplateSelect = (templateId: string) => {
    if (templateId) {
      const template = templates.find(t => t.id === templateId);
      if (template) {
        setPrompt(template.content);
        setVariables(template.variables || {});
        setTestCases(template.testCases || []);
        setActiveTemplate(templateId);
        toast({
          title: 'Template loaded',
          description: `Loaded "${template.name}"`,
          status: 'info',
        });
      }
    } else {
      setActiveTemplate(null);
    }
  };

  return (
    <Box p={4}>
      <Flex justifyContent="space-between" alignItems="center" mb={4}>
        <Heading size="lg">Prompt Engineering Workbench</Heading>
        <HStack>
          <Select 
            placeholder="Select model"
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
            w="200px"
          >
            {models.map(model => (
              <option key={model.id} value={model.id}>{model.name}</option>
            ))}
          </Select>
          <Select
            placeholder="Load template"
            value={activeTemplate || ""}
            onChange={(e) => handleTemplateSelect(e.target.value)}
            w="250px"
          >
            {templates.map(templat(e: any) => (
              <option key={template.id} value={template.id}>{template.name}</option>
            ))}
          </Select>
          <Button 
            colorScheme="blue"
            onClick={handleSave}
          >
            Save Template
          </Button>
          <Button
            colorScheme="green"
            onClick={handleGenerate}
            isLoading={isGenerating}
          >
            Generate
          </Button>
        </HStack>
      </Flex>

      <Tabs variant="enclosed">
        <TabList>
          <Tab>Edit Prompt</Tab>
          <Tab>Variables</Tab>
          <Tab>Test Cases</Tab>
          <Tab>Results</Tab>
          <Tab>Version History</Tab>
        </TabList>

        <TabPanels>
          <TabPanel>
            <PromptEditor prompt={prompt} onChange={handlePromptChange} />
          </TabPanel>
          <TabPanel>
            <VariableManager variables={variables} onChange={handleVariablesChange} />
          </TabPanel>
          <TabPanel>
            <TestCaseManager testCases={testCases} onChange={handleTestCasesChange} />
          </TabPanel>
          <TabPanel>
            <ResultsViewer results={results} />
          </TabPanel>
          <TabPanel>
            <VersionHistory templateId={activeTemplate} />
          </TabPanel>
        </TabPanels>
      </Tabs>

      <PromptSaveModal 
        isOpen={isOpen} 
        onClose={onClose} 
        onSave={(name, description) => {
          saveTemplate({
            id: activeTemplate || undefined,
            name,
            description,
            content: prompt,
            variables,
            testCases
          });
          toast({
            title: 'Template saved',
            status: 'success',
          });
        }}
        initialData={activeTemplate ? templates.find(t => t.id === activeTemplate) : undefined}
      />
    </Box>
  );
};
