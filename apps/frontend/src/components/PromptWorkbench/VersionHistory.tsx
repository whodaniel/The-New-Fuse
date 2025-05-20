import React, { useState, useEffect } from 'react';
import {
  Box,
  VStack,
  Text,
  Button,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  Divider,
  Flex,
  Heading,
  Spinner,
  useToast,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton
} from '@chakra-ui/react';
import { 
  usePromptTemplates, 
  PromptTemplateVersion 
} from '../../hooks/usePromptTemplates.js';
import { format } from 'date-fns';

interface VersionHistoryProps {
  templateId: string | null;
}

export const VersionHistory: React.React.FC<VersionHistoryProps> = ({ templateId }) => {
  const { getTemplateVersions, loadTemplate } = usePromptTemplates();
  const [versions, setVersions] = useState<PromptTemplateVersion[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedVersion, setSelectedVersion] = useState<PromptTemplateVersion | null>(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();

  useEffect(() => {
    if (templateId) {
      loadVersions();
    } else {
      setVersions([]);
    }
  }, [templateId]);

  const loadVersions = async () => {
    if (!templateId) return;
    
    setLoading(true);
    try {
      const versionHistory = await getTemplateVersions(templateId);
      setVersions(versionHistory);
    } catch (error) {
      toast({
        title: 'Error loading version history',
        description: error.message,
        status: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleViewVersion = (version: PromptTemplateVersion) => {
    setSelectedVersion(version);
    onOpen();
  };

  const handleRestoreVersion = async (version: PromptTemplateVersion) => {
    if (!templateId) return;
    
    try {
      // Load the current template
      const currentTemplate = await loadTemplate(templateId);
      
      // Update with the version's content
      await loadTemplate(templateId);
      
      toast({
        title: 'Version restored',
        description: `Restored to version from ${format(new Date(version.createdAt), 'PPpp')}`,
        status: 'success',
      });
    } catch (error) {
      toast({
        title: 'Error restoring version',
        description: error.message,
        status: 'error',
      });
    }
  };

  if (!templateId) {
    return (
      <Box textAlign="center" py={10}>
        <Text color="gray.500">Please select a template to view version history.</Text>
      </Box>
    );
  }

  if (loading) {
    return (
      <Flex justify="center" align="center" height="300px">
        <Spinner size="xl" />
      </Flex>
    );
  }

  return (
    <VStack spacing={4} align="stretch">
      <Flex justifyContent="space-between" alignItems="center">
        <Heading size="md">Version History</Heading>
        <Button size="sm" onClick={loadVersions}>Refresh</Button>
      </Flex>

      {versions.length === 0 ? (
        <Box textAlign="center" py={8} borderWidth={1} borderRadius="md" borderStyle="dashed">
          <Text color="gray.500">No version history available.</Text>
          <Text fontSize="sm" color="gray.400" mt={2}>
            Version history will be created when you update this template.
          </Text>
        </Box>
      ) : (
        <Table variant="simple">
          <Thead>
            <Tr>
              <Th>Version</Th>
              <Th>Created</Th>
              <Th>By</Th>
              <Th>Comment</Th>
              <Th>Actions</Th>
            </Tr>
          </Thead>
          <Tbody>
            {versions.map((version, index) => (
              <Tr key={version.id}>
                <Td>
                  {index === 0 ? (
                    <Badge colorScheme="green">Latest</Badge>
                  ) : (
                    <Text>v{versions.length - index}</Text>
                  )}
                </Td>
                <Td>
                  {format(new Date(version.createdAt), 'MMM d, yyyy h:mm a')}
                </Td>
                <Td>{version.createdBy}</Td>
                <Td>
                  <Text noOfLines={1}>
                    {version.comment || <Text as="i" color="gray.500">No comment</Text>}
                  </Text>
                </Td>
                <Td>
                  <Button size="xs" mr={2} onClick={() => handleViewVersion(version)}>
                    View
                  </Button>
                  {index > 0 && (
                    <Button size="xs" colorScheme="blue" onClick={() => handleRestoreVersion(version)}>
                      Restore
                    </Button>
                  )}
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      )}

      {/* Version Detail Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            Version from {selectedVersion ? format(new Date(selectedVersion.createdAt), 'PPpp') : ''}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {selectedVersion && (
              <VStack spacing={4} align="stretch">
                <Box>
                  <Text fontWeight="bold">Comment:</Text>
                  <Text>{selectedVersion.comment || 'No comment'}</Text>
                </Box>
                <Divider />
                <Box>
                  <Text fontWeight="bold" mb={2}>Template Content:</Text>
                  <Box
                    p={3}
                    borderWidth={1}
                    borderRadius="md"
                    fontFamily="mono"
                    fontSize="sm"
                    whiteSpace="pre-wrap"
                    bg="gray.50"
                    maxH="300px"
                    overflowY="auto"
                  >
                    {selectedVersion.content}
                  </Box>
                </Box>
                <Box>
                  <Text fontWeight="bold" mb={2}>Variables:</Text>
                  <Table size="sm">
                    <Thead>
                      <Tr>
                        <Th>Name</Th>
                        <Th>Default Value</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {Object.entries(selectedVersion.variables).map(([key, value]) => (
                        <Tr key={key}>
                          <Td>{key}</Td>
                          <Td>{value}</Td>
                        </Tr>
                      ))}
                      {Object.keys(selectedVersion.variables).length === 0 && (
                        <Tr>
                          <Td colSpan={2} textAlign="center" py={2}>No variables defined</Td>
                        </Tr>
                      )}
                    </Tbody>
                  </Table>
                </Box>
              </VStack>
            )}
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose}>
              Close
            </Button>
            {selectedVersion && (
              <Button colorScheme="blue" onClick={() => handleRestoreVersion(selectedVersion)}>
                Restore This Version
              </Button>
            )}
          </ModalFooter>
        </ModalContent>
      </Modal>
    </VStack>
  );
};
