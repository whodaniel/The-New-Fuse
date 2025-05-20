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
  useToast,
  Badge,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon
} from '@chakra-ui/react';
import { FaPlus, FaTrash, FaEdit } from 'react-icons/fa';

interface TestCase {
  id: string;
  name: string;
  description?: string;
  variables: Record<string, string>;
}

interface TestCaseManagerProps {
  testCases: TestCase[];
  onChange: (testCases: TestCase[]) => void;
}

export const TestCaseManager: React.React.FC<TestCaseManagerProps> = ({ testCases, onChange }) => {
  const toast = useToast();
  const [newTestCase, setNewTestCase] = useState<TestCase>({
    id: '',
    name: '',
    description: '',
    variables: {}
  });
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [newVarName, setNewVarName] = useState('');
  const [newVarValue, setNewVarValue] = useState('');

  const handleAddTestCase = () => {
    if (!newTestCase.name.trim()) {
      toast({
        title: 'Test case name required',
        status: 'warning',
        duration: 2000,
      });
      return;
    }

    const id = isEditing || `test-${Date.now()}`;
    const updatedTestCases = isEditing
      ? testCases.map(tc => (tc.id === id ? { ...newTestCase, id } : tc))
      : [...testCases, { ...newTestCase, id }];

    onChange(updatedTestCases);
    
    // Reset form
    setNewTestCase({
      id: '',
      name: '',
      description: '',
      variables: {}
    });
    setIsEditing(null);
  };

  const handleDeleteTestCase = (id: string) => {
    onChange(testCases.filter(tc => tc.id !== id));
  };

  const handleEditTestCase = (testCase: TestCase) => {
    setNewTestCase(testCase);
    setIsEditing(testCase.id);
  };

  const handleAddVariable = () => {
    if (!newVarName.trim()) {
      toast({
        title: 'Variable name required',
        status: 'warning',
        duration: 2000,
      });
      return;
    }

    setNewTestCase({
      ...newTestCase,
      variables: {
        ...newTestCase.variables,
        [newVarName]: newVarValue
      }
    });
    
    // Clear inputs
    setNewVarName('');
    setNewVarValue('');
  };

  const handleDeleteVariable = (name: string) => {
    const updatedVariables = { ...newTestCase.variables };
    delete updatedVariables[name];
    
    setNewTestCase({
      ...newTestCase,
      variables: updatedVariables
    });
  };

  return (
    <VStack spacing={6} align="stretch">
      <Box p={4} borderWidth={1} borderRadius="md">
        <VStack spacing={4} align="stretch">
          <Text fontWeight="bold" fontSize="lg">
            {isEditing ? 'Edit Test Case' : 'New Test Case'}
          </Text>
          
          <Input
            placeholder="Test Case Name"
            value={newTestCase.name}
            onChange={(e) => setNewTestCase({ ...newTestCase, name: e.target.value })}
          />
          
          <Input
            placeholder="Description (optional)"
            value={newTestCase.description}
            onChange={(e) => setNewTestCase({ ...newTestCase, description: e.target.value })}
          />
          
          <Box>
            <Text fontWeight="medium" mb={2}>Test Variables</Text>
            <HStack mb={3}>
              <Input
                placeholder="Variable Name"
                size="sm"
                value={newVarName}
                onChange={(e) => setNewVarName(e.target.value)}
              />
              <Input
                placeholder="Value"
                size="sm"
                value={newVarValue}
                onChange={(e) => setNewVarValue(e.target.value)}
              />
              <Button size="sm" leftIcon={<FaPlus />} onClick={handleAddVariable}>
                Add
              </Button>
            </HStack>
            
            <Table size="sm" variant="simple">
              <Thead>
                <Tr>
                  <Th>Variable</Th>
                  <Th>Value</Th>
                  <Th width="50px">Actions</Th>
                </Tr>
              </Thead>
              <Tbody>
                {Object.entries(newTestCase.variables).map(([name, value]) => (
                  <Tr key={name}>
                    <Td>{name}</Td>
                    <Td>{value}</Td>
                    <Td>
                      <IconButton
                        aria-label="Delete variable"
                        icon={<FaTrash />}
                        size="xs"
                        colorScheme="red"
                        variant="ghost"
                        onClick={() => handleDeleteVariable(name)}
                      />
                    </Td>
                  </Tr>
                ))}
                {Object.keys(newTestCase.variables).length === 0 && (
                  <Tr>
                    <Td colSpan={3} textAlign="center" py={2}>
                      <Text fontSize="sm" color="gray.500">No variables added</Text>
                    </Td>
                  </Tr>
                )}
              </Tbody>
            </Table>
          </Box>
          
          <Button
            colorScheme="blue"
            alignSelf="flex-end"
            onClick={handleAddTestCase}
          >
            {isEditing ? 'Update Test Case' : 'Add Test Case'}
          </Button>
        </VStack>
      </Box>
      
      <Box>
        <Text fontWeight="bold" fontSize="lg" mb={4}>
          Test Cases ({testCases.length})
        </Text>
        
        <Accordion allowMultiple>
          {testCases.map((testCase) => (
            <AccordionItem key={testCase.id}>
              <h2>
                <AccordionButton>
                  <Box flex="1" textAlign="left">
                    <HStack>
                      <Text fontWeight="medium">{testCase.name}</Text>
                      <Badge>
                        {Object.keys(testCase.variables).length} variables
                      </Badge>
                    </HStack>
                  </Box>
                  <AccordionIcon />
                </AccordionButton>
              </h2>
              <AccordionPanel pb={4}>
                <VStack align="stretch" spacing={3}>
                  {testCase.description && (
                    <Text fontSize="sm" color="gray.600">
                      {testCase.description}
                    </Text>
                  )}
                  
                  <Box>
                    <Text fontWeight="medium" fontSize="sm" mb={1}>Variables:</Text>
                    <Table size="sm" variant="simple">
                      <Thead>
                        <Tr>
                          <Th>Name</Th>
                          <Th>Value</Th>
                        </Tr>
                      </Thead>
                      <Tbody>
                        {Object.entries(testCase.variables).map(([name, value]) => (
                          <Tr key={name}>
                            <Td>{name}</Td>
                            <Td>{value}</Td>
                          </Tr>
                        ))}
                      </Tbody>
                    </Table>
                  </Box>
                  
                  <HStack justifyContent="flex-end">
                    <Button
                      size="sm"
                      leftIcon={<FaEdit />}
                      onClick={() => handleEditTestCase(testCase)}
                    >
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      colorScheme="red"
                      leftIcon={<FaTrash />}
                      onClick={() => handleDeleteTestCase(testCase.id)}
                    >
                      Delete
                    </Button>
                  </HStack>
                </VStack>
              </AccordionPanel>
            </AccordionItem>
          ))}
        </Accordion>
        
        {testCases.length === 0 && (
          <Box textAlign="center" py={6} borderWidth={1} borderRadius="md" borderStyle="dashed">
            <Text color="gray.500">No test cases added yet</Text>
          </Box>
        )}
      </Box>
    </VStack>
  );
};
