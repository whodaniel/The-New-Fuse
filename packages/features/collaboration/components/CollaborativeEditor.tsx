import { Editor } from '@/components/ui/editor';
import { useYjs } from '@/hooks/useYjs';
import { FC } from 'react';

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
