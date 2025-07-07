import React from 'react';
import { useDocumentation } from '@/hooks/useDocumentation';
import { APIReference } from './APIReference';
import { StyleGuide } from './StyleGuide';

export const ComponentDocs: React.FC = () => {
  const { components, api, styles } = useDocumentation();

  return (
    <div className="documentation">
      <APIReference components={components} api={api} />
      <StyleGuide styles={styles} />
      <CodeExamples />
      <BestPractices />
    </div>
  );
};