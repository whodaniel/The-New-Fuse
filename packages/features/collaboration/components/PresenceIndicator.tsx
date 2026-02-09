import React, { FC } from "react";
import { Avatar } from '@/components/ui/avatar';
import { Tooltip } from '@/components/ui/tooltip';

export const PresenceIndicator: FC<{
  user: { id: string; name: string; status: string; avatar: string; }
}> = ({ user }) => {
  return (
    <Tooltip content={`${user.name} (${user.status})`}>
      <Avatar
        src={user.avatar}
        status={user.status}
        className="presence-indicator"
      />
    </Tooltip>
  );
};