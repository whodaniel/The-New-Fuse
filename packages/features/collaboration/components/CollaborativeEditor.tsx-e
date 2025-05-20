import React, { FC } from "react";
import { useYjs } from '@/hooks/useYjs';
import { Editor } from '@/components/ui/editor';

export const CollaborativeEditor: FC<{
  content: unknown;
  onUpdate: (content: unknown) => void;
}> = ({ content, onUpdate }) => {
  const { awareness, document } = useYjs();

  return (
    <Editor
      value={content}
      onChange={onUpdate}
      awareness={awareness}
      collaborative
      cursors
      presence
    />
  );
};