import React from 'react';
import { Timeline } from '@/components/ui/timeline';
import { DiffViewer } from '@/components/ui/diff';

export const AgentVersionControl: React.FC = () => {
  const [selectedVersion, setSelectedVersion] = useState<string | null>(null);
  const { versions, diffs } = useVersionHistory();

  return (
    <div className="flex h-full">
      <div className="w-1/3 border-r">
        <Timeline
          items={versions}
          onSelect={setSelectedVersion}
          branches={['main', 'staging', 'experimental']}
        />
        
        <Button
          className="mt-4"
          onClick={() => {/* Create new version */}}
        >
          Create Version
        </Button>
      </div>

      <div className="w-2/3 p-4">
        {selectedVersion && (
          <>
            <DiffViewer
              original={diffs.original}
              modified={diffs.modified}
              components={[
                'knowledge_base',
                'behavior_rules',
                'model_weights',
                'configuration'
              ]}
            />
            
            <div className="mt-4 flex gap-2">
              <Button onClick={() => {/* Rollback */}}>
                Rollback to Version
              </Button>
              <Button onClick={() => {/* Branch */}}>
                Create Branch
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};