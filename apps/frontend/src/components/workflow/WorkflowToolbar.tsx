import React from 'react';
import { Box, Button, HStack, Input, Text } from '@chakra-ui/react';

interface WorkflowToolbarProps {
  workflowName: string;
  onNameChange: (name: string) => void;
  onSave: () => void;
  onExecute: () => void;
  isSaving: boolean;
  isExecuting: boolean;
}

export const WorkflowToolbar: React.FC<WorkflowToolbarProps> = ({
  workflowName,
  onNameChange,
  onSave,
  onExecute,
  isSaving,
  isExecuting
}) => {
  return (
    <Box 
      position="absolute" 
      top="10px" 
      left="10px" 
      right="10px" 
      zIndex="10" 
      bg="white" 
      p={3} 
      borderRadius="md" 
      boxShadow="md"
      borderWidth="1px"
    >
      <HStack spacing={4} justify="space-between">
        <HStack spacing={2}>
          <Text fontSize="sm" fontWeight="medium">Workflow:</Text>
          <Input
            value={workflowName}
            onChange={(e) => onNameChange(e.target.value)}
            size="sm"
            width="200px"
            placeholder="Enter workflow name"
          />
        </HStack>
        
        <HStack spacing={2}>
          <Button
            size="sm"
            colorScheme="blue"
            onClick={onSave}
            isLoading={isSaving}
            loadingText="Saving..."
          >
            Save
          </Button>
          <Button
            size="sm"
            colorScheme="green"
            onClick={onExecute}
            isLoading={isExecuting}
            loadingText="Executing..."
          >
            Execute
          </Button>
        </HStack>
      </HStack>
    </Box>
  );
};