import React, { useState } from 'react';
import { Checkbox, FormControl, FormLabel, Stack, Heading, Box, Text, Accordion, AccordionItem, AccordionButton, AccordionPanel, AccordionIcon } from '@chakra-ui/react';
import { AgentToolType } from '@the-new-fuse/core/types/src/agent';

interface AgentToolsFormProps {
  selectedTools: AgentToolType[];
  onChange: (tools: AgentToolType[]) => void;
}

export const AgentToolsForm: React.FC<AgentToolsFormProps> = ({ selectedTools, onChange }) => {
  const handleToolToggle = (tool: AgentToolType) => {
    if (selectedTools.includes(tool)) {
      onChange(selectedTools.filter(t => t !== tool));
    } else {
      onChange([...selectedTools, tool]);
    }
  };

  const toolCategories = [
    {
      name: 'File Management',
      tools: [
        { id: AgentToolType.SAVE_FILE, label: 'Save File', description: 'Create new files with content' },
        { id: AgentToolType.EDIT_FILE, label: 'Edit File', description: 'View, create, and edit files' },
        { id: AgentToolType.REMOVE_FILES, label: 'Remove Files', description: 'Safely delete files' },
      ]
    },
    {
      name: 'Web Interaction',
      tools: [
        { id: AgentToolType.OPEN_BROWSER, label: 'Open Browser', description: 'Open URLs in the default browser' },
        { id: AgentToolType.WEB_SEARCH, label: 'Web Search', description: 'Search the web for information' },
        { id: AgentToolType.WEB_FETCH, label: 'Web Fetch', description: 'Fetch and convert webpage content to Markdown' },
      ]
    },
    {
      name: 'Process Management',
      tools: [
        { id: AgentToolType.LAUNCH_PROCESS, label: 'Launch Process', description: 'Run shell commands' },
        { id: AgentToolType.KILL_PROCESS, label: 'Kill Process', description: 'Terminate processes' },
        { id: AgentToolType.READ_PROCESS, label: 'Read Process', description: 'Read output from a terminal' },
        { id: AgentToolType.WRITE_PROCESS, label: 'Write Process', description: 'Write input to a terminal' },
        { id: AgentToolType.LIST_PROCESSES, label: 'List Processes', description: 'List all known terminals and their states' },
      ]
    },
    {
      name: 'Code Analysis',
      tools: [
        { id: AgentToolType.DIAGNOSTICS, label: 'Diagnostics', description: 'Get issues from the IDE' },
        { id: AgentToolType.CODEBASE_RETRIEVAL, label: 'Codebase Retrieval', description: 'Search the codebase for information' },
      ]
    },
    {
      name: 'Integration Tools',
      tools: [
        { id: AgentToolType.GITHUB_API, label: 'GitHub API', description: 'Interact with GitHub API' },
        { id: AgentToolType.LINEAR, label: 'Linear', description: 'Interact with Linear API' },
        { id: AgentToolType.JIRA, label: 'Jira', description: 'Interact with Jira API' },
        { id: AgentToolType.CONFLUENCE, label: 'Confluence', description: 'Interact with Confluence API' },
        { id: AgentToolType.NOTION, label: 'Notion', description: 'Interact with Notion API' },
        { id: AgentToolType.SUPABASE, label: 'Supabase', description: 'Interact with Supabase API' },
      ]
    },
    {
      name: 'Memory Tools',
      tools: [
        { id: AgentToolType.REMEMBER, label: 'Remember', description: 'Create long-term memories' },
      ]
    },
  ];

  return (
    <Box>
      <Heading size="md" mb={4}>Agent Tools</Heading>
      <Text mb={4}>Select the tools this agent can use:</Text>
      
      <Accordion allowMultiple defaultIndex={[0]}>
        {toolCategories.map((category, idx) => (
          <AccordionItem key={idx}>
            <h2>
              <AccordionButton>
                <Box flex="1" textAlign="left" fontWeight="medium">
                  {category.name}
                </Box>
                <AccordionIcon />
              </AccordionButton>
            </h2>
            <AccordionPanel pb={4}>
              <Stack spacing={2}>
                {category.tools.map((tool) => (
                  <FormControl key={tool.id}>
                    <Checkbox 
                      isChecked={selectedTools.includes(tool.id)}
                      onChange={() => handleToolToggle(tool.id)}
                    >
                      <Box>
                        <Text fontWeight="medium">{tool.label}</Text>
                        <Text fontSize="sm" color="gray.600">{tool.description}</Text>
                      </Box>
                    </Checkbox>
                  </FormControl>
                ))}
              </Stack>
            </AccordionPanel>
          </AccordionItem>
        ))}
      </Accordion>
    </Box>
  );
};
