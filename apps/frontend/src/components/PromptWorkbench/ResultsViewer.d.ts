import React from 'react';
interface Result {
  testCase?: string;
  prompt: string;
  result: string;
  timestamp: string;
}
interface ResultsViewerProps {
  results: Result[];
}
export declare const ResultsViewer: React.FC<ResultsViewerProps>;
export {};
