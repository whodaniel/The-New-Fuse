import React from 'react';
interface VariableManagerProps {
  variables: Record<string, string>;
  onChange: (variables: Record<string, string>) => void;
}
export declare const VariableManager: React.FC<VariableManagerProps>;
export {};
