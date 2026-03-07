import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/design-system';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
} from '@/components/ui/modal';
import { PromptTemplate } from '../../hooks/usePromptTemplates';

interface PromptSaveModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (name: string, description: string, comment?: string) => void;
  initialData?: PromptTemplate;
}

export const PromptSaveModal: React.FC<PromptSaveModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
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
          <div className="flex flex-col gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Template Name <span className="text-danger-500">*</span>
              </label>
              <input
                type="text"
                placeholder="Enter a name for this template"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-md bg-white dark:bg-neutral-800"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Description</label>
              <textarea
                placeholder="Describe the purpose of this template"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-md bg-white dark:bg-neutral-800"
              />
            </div>

            {isUpdate && (
              <div>
                <label className="block text-sm font-medium mb-2">Version Comment</label>
                <textarea
                  placeholder="What changed in this version? (optional)"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-md bg-white dark:bg-neutral-800"
                />
              </div>
            )}
          </div>
        </ModalBody>

        <ModalFooter>
          <Button variant="ghost" onClick={onClose} className="mr-3">
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSave} disabled={!name.trim()}>
            {isUpdate ? 'Update' : 'Save'}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};
