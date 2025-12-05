import React from 'react';
import { PromptTemplate } from '../../hooks/usePromptTemplates';
interface PromptSaveModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (name: string, description: string, comment?: string) => void;
  initialData?: PromptTemplate;
}
export declare const PromptSaveModal: React.FC<PromptSaveModalProps>;
export {};
