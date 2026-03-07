import React, { FC, useState } from 'react';
import { Split } from '@/components/ui/split';
import { Chat } from '@/components/ui/chat';
import { WorkflowCanvas } from '@/components/ui/workflow-canvas';

export const AgentWorkspace: FC<{ workspaceData: unknown }> = () => {
  const [activeAgents, setActiveAgents] = useState<string[]>([]);
  const [workspaceData, setWorkspaceData] = useState({});

  return (
    <Split>
      <div className="w-3/4">
        <WorkflowCanvas
          agents={activeAgents}
          onAgentInteraction={(agentId, data) => {
            // Handle agent interactions
          }}
          tools={[
            'flowchart',
            'codeEditor',
            'whiteboard',
            'documentViewer'
          ]}
        />
      </div>
      
      <div className="w-1/4">
        <Chat
          participants={activeAgents}
          threadId={workspaceData.threadId}
          enableVoice
          enableVideo
        />
      </div>
    </Split>
  );
};
