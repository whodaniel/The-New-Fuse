import React, { FC } from "react";
import { useCollaboration } from '@/hooks/useCollaboration';
import { PresenceIndicator } from '@the-new-fuse/PresenceIndicator';
import { CollaborativeEditor } from '@the-new-fuse/CollaborativeEditor';

export const SharedWorkspace: FC<{ : unknown }> = () => {
  const { activeUsers, workspace, sync } = useCollaboration();

  return (
    <div className="shared-workspace">
      <div className="workspace-header">
        <h2>{workspace.name}</h2>
        <div className="active-users">
          {activeUsers.map(user => (
            <PresenceIndicator key={user.id} user={user} />
          ))}
        </div>
      </div>
      <CollaborativeEditor
        content={workspace.content}
        onUpdate={sync}
      />
    </div>
  );
};
