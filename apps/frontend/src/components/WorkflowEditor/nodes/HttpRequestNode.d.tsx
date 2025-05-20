import React from 'react';
import { NodeProps } from 'reactflow';
interface HttpRequestData {
    parameters: {
        url: string;
        method: string;
        headers?: Record<string, string>;
        body?: string;
    };
}
export declare const httpRequestNode: ({ data, isConnectable }: NodeProps<HttpRequestData>) => React.JSX.Element;
export {};
