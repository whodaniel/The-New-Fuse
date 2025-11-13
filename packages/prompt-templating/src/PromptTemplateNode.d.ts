import React from 'react';
import { PromptTemplateService } from './types';
interface PromptTemplateNodeProps {
    id: string;
    data: {
        templateId?: string;
        versionId?: string;
        variables?: Record<string, any>;
        outputVariable?: string;
        templateService: PromptTemplateService;
        onTemplateSelect?: (templateId: string) => void;
        onVersionSelect?: (versionId: string) => void;
        onVariableChange?: (variables: Record<string, any>) => void;
        onOutputVariableChange?: (outputVariable: string) => void;
    };
    selected?: boolean;
}
export declare const PromptTemplateNode: React.FC<PromptTemplateNodeProps>;
export default PromptTemplateNode;
//# sourceMappingURL=PromptTemplateNode.d.ts.map