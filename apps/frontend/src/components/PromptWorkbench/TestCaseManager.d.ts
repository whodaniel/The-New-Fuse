import React from 'react';
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
export declare const TestCaseManager: React.React.FC<TestCaseManagerProps>;
export {};
