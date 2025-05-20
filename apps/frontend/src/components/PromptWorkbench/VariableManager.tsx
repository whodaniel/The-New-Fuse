import React, { useState } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Input,
  Button,
  IconButton,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  useToast
} from '@chakra-ui/react';
import { FaPlus, FaTrash } from 'react-icons/fa';

interface VariableManagerProps {
  variables: Record<string, string>;
  onChange: (variables: Record<string, string>) => void;
}

export const VariableManager: React.React.FC<VariableManagerProps> = ({ variables, onChange }) => {
  const toast = useToast();
  const [newVarName, setNewVarName] = useState('');
  const [newVarValue, setNewVarValue] = useState('');

  const handleAddVariable = () => {
    if (!newVarName.trim()) {
      toast({
        title: 'Variable name required',
        status: 'warning',
        duration: 2000,
      });
      return;
    }

    if (variables.hasOwnProperty(newVarName)) {
      toast({
        title: 'Variable already exists',
        status: 'warning',
        duration: 2000,
      });
      return;
    }

    const updatedVariables = {
      ...variables,
      [newVarName]: newVarValue
    };
    onChange(updatedVariables);
    
    // Clear the input fields
    setNewVarName('');
    setNewVarValue('');
  };

  const handleUpdateVariable = (name: string, value: string) => {
    const updatedVariables = {
      ...variables,
      [name]: value
    };
    onChange(updatedVariables);
  };

  const handleDeleteVariable = (name: string) => {
    const updatedVariables = { ...variables };
    delete updatedVariables[name];
    onChange(updatedVariables);
  };

  return (
    <VStack spacing={4} align="stretch">
      <HStack>
        <Input
          placeholder="Variable Name"
          value={newVarName}
          onChange={(e) => setNewVarName(e.target.value)}
        />
        <Input
          placeholder="Value"
          value={newVarValue}
          onChange={(e) => setNewVarValue(e.target.value)}
        />
        <Button leftIcon={<FaPlus />} colorScheme="blue" onClick={handleAddVariable}>
          Add
        </Button>
      </HStack>

      <Box border="1px" borderColor="gray.200" borderRadius="md" overflow="hidden">
        <Table variant="simple">
          <Thead>
            <Tr>
              <Th>Variable</Th>
              <Th>Value</Th>
              <Th width="80px">Actions</Th>
            </Tr>
          </Thead>
          <Tbody>
            {Object.entries(variables).map(([name, value]) => (
              <Tr key={name}>
                <Td>
                  <Text fontWeight="medium">{name}</Text>
                </Td>
                <Td>
                  <Input
                    value={value}
                    onChange={(e) => handleUpdateVariable(name, e.target.value)}
                    size="sm"
                  />
                </Td>
                <Td>
                  <IconButton
                    aria-label="Delete variable"
                    icon={<FaTrash />}
                    size="sm"
                    colorScheme="red"
                    variant="ghost"
                    onClick={() => handleDeleteVariable(name)}
                  />
                </Td>
              </Tr>
            ))}
            {Object.keys(variables).length === 0 && (
              <Tr>
                <Td colSpan={3}>
                  <Text textAlign="center" py={4} color="gray.500">
                    No variables defined
                  </Text>
                </Td>
              </Tr>
            )}
          </Tbody>
        </Table>
      </Box>
    </VStack>
  );
};
