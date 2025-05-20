import React from 'react';
import { NodeProps } from 'reactflow';
interface SlackNodeData {
    parameters: {
        channel: string;
        text: string;
        blocks?: string;
        threadTs?: string;
    };
    credentials?: {
        slackApi: string;
    };
}
export declare const slackNode: ({ data, isConnectable }: NodeProps<SlackNodeData>) => React.JSX.Element;
export {};
