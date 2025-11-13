import React from 'react';
import { WorkflowModel } from '@the-new-fuse/api-types';
interface WorkflowEditorProps {
    initialDefinition: WorkflowModel;
    onSave: (definition: WorkflowModel) => void;
}
declare const WorkflowEditor: React.FC<WorkflowEditorProps>;
export { WorkflowEditor };
//# sourceMappingURL=WorkflowEditor.d.ts.map