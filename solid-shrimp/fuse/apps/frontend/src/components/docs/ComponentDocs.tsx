// @ts-nocheck
import { useDocumentation } from '@/hooks/useDocumentation';
import React from 'react';
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
