import React from 'react';
interface CollectionEditorProps {
    items: any[];
    schema: {
        properties: Array<{
            name: string;
            displayName: string;
            type: string;
            default?: any;
            required?: boolean;
            options?: Array<{
                name: string;
                value: any;
            }>;
        }>;
    };
    onChange: (items: any[]) => void;
}
export declare const CollectionEditor: React.React.FC<CollectionEditorProps>;
export {};
