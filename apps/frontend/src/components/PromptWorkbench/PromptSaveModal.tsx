import React, { useState, useEffect } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  VStack
} from '@chakra-ui/react';
import { PromptTemplate } from '../../hooks/usePromptTemplates.js';

interface PromptSaveModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (name: string, description: string, comment?: string) => void;
  initialData?: PromptTemplate;
}

export const PromptSaveModal: React.React.FC<PromptSaveModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [comment, setComment] = useState('');
  const isUpdate = !!initialData?.id;

  useEffect(() => {
    if (initialData) {
      setName(initialData.name || '');
      setDescription(initialData.description || '');
      setComment('');
    } else {
      setName('');
      setDescription('');
      setComment('');
    }
  }, [initialData, isOpen]);

  const handleSave = () => {
    onSave(name, description, comment);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>{isUpdate ? 'Update Prompt Template' : 'Save Prompt Template'}</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack spacing={4}>
            <FormControl isRequired>
              <FormLabel>Template Name</FormLabel>
              <Input
                placeholder="Enter a name for this template"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </FormControl>
            
            <FormControl>
              <FormLabel>Description</FormLabel>
              <Textarea
                placeholder="Describe the purpose of this template"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </FormControl>
            
            {isUpdate && (
              <FormControl>
                <FormLabel>Version Comment</FormLabel>
                <Textarea
                  placeholder="What changed in this version? (optional)"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  rows={2}
                />
              </FormControl>
            )}
          </VStack>
        </ModalBody>

        <ModalFooter>
          <Button variant="ghost" mr={3} onClick={onClose}>
            Cancel
          </Button>
          <Button 
            colorScheme="blue" 
            onClick={handleSave}
            isDisabled={!name.trim()}
          >
            {isUpdate ? 'Update' : 'Save'}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};
