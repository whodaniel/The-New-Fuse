import React, { useState } from 'react';
import { Editor } from '@/components/ui/editor';
import { TreeView } from '@/components/ui/tree-view';
import { Button } from '@/components/ui/button';

interface KnowledgeNode {
  id: string;
  title: string;
  content: string;
  children?: KnowledgeNode[];
}

export const KnowledgeBaseEditor: React.FC = () => {
  const [selectedNode, setSelectedNode] = useState<KnowledgeNode | null>(null);
  const [knowledgeTree, setKnowledgeTree] = useState<KnowledgeNode[]>([]);

  const handleSave = async (content: string) => {
    if (!selectedNode) return;
    // Update knowledge base logic
  };

  return (
    <div className="flex h-full">
      <div className="w-1/4 border-r">
        <TreeView
          data={knowledgeTree}
          onNodeSelect={setSelectedNode}
        />
        <Button
          className="mt-4"
          onClick={() => {/* Add new node logic */}}
        >
          Add New Entry
        </Button>
      </div>
      
      <div className="w-3/4 p-4">
        {selectedNode ? (
          <Editor
            value={selectedNode.content}
            onChange={handleSave}
            supportMarkdown
            autoSave
          />
        ) : (
          <div className="text-center text-gray-500">
            Select a knowledge base entry to edit
          </div>
        )}
      </div>
    </div>
  );
};