import { DragDropContext, DropResult } from '@hello-pangea/dnd';
import { PromptBlock, PromptCompiler } from '@the-new-fuse/prompt-templating';
import { Check, Code, Copy, Play, Save, Share2 } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { PublishFormData, PublishModal } from '../marketplace/components/PublishModal';
import { BuilderCanvas } from './components/BuilderCanvas';
import { SnippetLibrary } from './components/SnippetLibrary';

// --- MOCK DATA FOR LIBRARY (Needs to match SnippetLibrary definition for lookup) ---
// Ideally this should be shared or passed in. For now duplicating the lookup logic or logic to extract content.
const LIBRARY_ITEMS_LOOKUP: Record<string, Partial<PromptBlock>[]> = {
  'library-roles': [
    {
      type: 'system',
      content: 'You are an expert senior software engineer.',
      metadata: { name: 'Expert Dev' },
    },
    {
      type: 'system',
      content: 'You are a helpful customer support agent.',
      metadata: { name: 'Support Agent' },
    },
    {
      type: 'system',
      content: 'You are a creative writer.',
      metadata: { name: 'Creative Writer' },
    },
  ],
  'library-structure': [
    {
      type: 'instruction',
      content: 'Think step by step before answering.',
      metadata: { name: 'Chain of Thought' },
    },
    {
      type: 'instruction',
      content: 'Provide the output in JSON format.',
      metadata: { name: 'JSON Output' },
    },
    {
      type: 'variable',
      content: '{{user_input}}',
      metadata: { name: 'User Input', description: 'Main input variable' },
    },
  ],
  'library-safety': [
    {
      type: 'system',
      content: 'Do not generate harmful or illegal content.',
      metadata: { name: 'Basic Safety' },
    },
    {
      type: 'condition',
      content: 'Check if user is unverified',
      metadata: {
        name: 'Verification Check',
        condition: { variable: 'verified', operator: 'equals', value: false },
      },
    },
  ],
};

export const PromptBuilder: React.FC = () => {
  const [blocks, setBlocks] = useState<PromptBlock[]>([]);
  const [activeTab, setActiveTab] = useState<'canvas' | 'preview'>('canvas');
  const [previewContent, setPreviewContent] = useState('');
  const [previewVariables, setPreviewVariables] = useState<Record<string, any>>({});
  const [compiler] = useState(new PromptCompiler());

  const [copied, setCopied] = useState(false);
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);

  const handlePublish = async (data: PublishFormData) => {
    // Determine asset type
    const assetType = 'PROMPT';

    // Calculate prompt content from blocks
    const promptContent = compiler.compile(blocks, {}); // Or handle as structured blocks

    // Call API (mock for now)
    console.log('Publishing asset:', { ...data, assetType, promptContent });

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));

    setIsPublishModalOpen(false);
    alert(`Successfully published "${data.name}" to the marketplace!`);
  };

  // Auto-compile for preview
  useEffect(() => {
    if (activeTab === 'preview') {
      try {
        const result = compiler.compile(blocks, previewVariables);
        setPreviewContent(result);
      } catch (e) {
        setPreviewContent('Error compiling template.');
      }
    }
  }, [blocks, activeTab, previewVariables]);

  const onDragEnd = (result: DropResult) => {
    const { source, destination } = result;

    // Dropped outside
    if (!destination) return;

    // Reordering within canvas
    if (source.droppableId === 'builder-canvas' && destination.droppableId === 'builder-canvas') {
      const newBlocks = Array.from(blocks);
      const [reorderedItem] = newBlocks.splice(source.index, 1);
      newBlocks.splice(destination.index, 0, reorderedItem);

      // Update positions
      const updated = newBlocks.map((b, i) => ({ ...b, position: i }));
      setBlocks(updated);
      return;
    }

    // Dropping from Library to Canvas
    if (source.droppableId.startsWith('library-') && destination.droppableId === 'builder-canvas') {
      const sourceList = LIBRARY_ITEMS_LOOKUP[source.droppableId];
      const sourceItem = sourceList[source.index];

      const newBlock: PromptBlock = {
        id: uuidv4(),
        type: sourceItem.type!,
        content: sourceItem.content!, // Ensure content is copied
        position: destination.index,
        locked: false,
        collapsed: false,
        metadata: {
          ...sourceItem.metadata,
        },
        children: [],
      };

      const newBlocks = Array.from(blocks);
      newBlocks.splice(destination.index, 0, newBlock);

      const updated = newBlocks.map((b, i) => ({ ...b, position: i }));
      setBlocks(updated);
    }
  };

  const handleUpdateBlock = (id: string, updates: Partial<PromptBlock>) => {
    setBlocks(blocks.map((b) => (b.id === id ? { ...b, ...updates } : b)));
  };

  const handleDeleteBlock = (id: string) => {
    setBlocks(blocks.filter((b) => b.id !== id));
  };

  const copyToClipboard = () => {
    // Compile with NO variables to get the raw template or interpolated?
    // Usually user wants the raw template.
    // The compiler currently substitutes.
    // Ideally we want the raw blocks joined.
    // Or we compile with empty vars but keep {{}}? Compiler logic might strip them if logic was strict, but ours keeps original.
    const result = compiler.compile(blocks, {});
    navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="h-screen flex flex-col bg-gray-100">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 h-14 px-6 flex items-center justify-between shadow-sm z-20">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Prompt Builder
          </h1>
          <div className="h-6 w-px bg-gray-200" />
          <nav className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => setActiveTab('canvas')}
              className={`px-3 py-1 text-sm font-medium rounded-md transition-all ${
                activeTab === 'canvas'
                  ? 'bg-white shadow text-gray-900'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Editor Canvas
            </button>
            <button
              onClick={() => setActiveTab('preview')}
              className={`px-3 py-1 text-sm font-medium rounded-md transition-all ${
                activeTab === 'preview'
                  ? 'bg-white shadow text-gray-900'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Live Preview
            </button>
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsPublishModalOpen(true)}
            className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors border border-indigo-200"
          >
            <Share2 size={16} />
            Publish
          </button>
          <button
            onClick={copyToClipboard}
            className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            {copied ? <Check size={16} className="text-green-600" /> : <Copy size={16} />}
            Copy
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 shadow-sm transition-colors">
            <Save size={16} />
            Save Template
          </button>
        </div>
      </header>

      {/* Modals */}
      <PublishModal
        isOpen={isPublishModalOpen}
        onClose={() => setIsPublishModalOpen(false)}
        onSubmit={handlePublish}
        initialName="My Awesome Prompt"
      />

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        <DragDropContext onDragEnd={onDragEnd}>
          {/* Left Sidebar - Snippet Library */}
          <SnippetLibrary />

          {/* Center Canvas */}
          {activeTab === 'canvas' ? (
            <BuilderCanvas
              blocks={blocks}
              onUpdateBlock={handleUpdateBlock}
              onDeleteBlock={handleDeleteBlock}
            />
          ) : (
            // Preview Tab
            <div className="flex-1 p-8 overflow-y-auto bg-white">
              <div className="max-w-4xl mx-auto grid grid-cols-3 gap-8">
                <div className="col-span-2 space-y-4">
                  <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                    <Code size={18} /> Compiled Output
                  </h3>
                  <div className="w-full h-[500px] p-6 bg-gray-900 text-gray-100 font-mono text-sm rounded-xl overflow-y-auto whitespace-pre-wrap shadow-inner border border-gray-700 leading-relaxed">
                    {previewContent}
                  </div>
                </div>

                <div className="col-span-1 space-y-4">
                  <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                    <Play size={18} /> Test Variables
                  </h3>
                  <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl space-y-4">
                    <p className="text-sm text-gray-500">
                      Enter values below to test variable substitution in real-time.
                    </p>

                    {/* Extract variables from blocks simply */}
                    {Array.from(
                      new Set(
                        blocks
                          .map((b) => b.content.match(/\{\{([^}]+)\}\}/g))
                          .flat()
                          .filter(Boolean)
                      )
                    ).map((vRaw: any) => {
                      const vName = vRaw.replace(/\{\{|\}\}/g, '').trim();
                      return (
                        <div key={vName}>
                          <label className="block text-xs font-semibold text-gray-600 mb-1">
                            {vName}
                          </label>
                          <input
                            type="text"
                            className="w-full text-sm p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder={`Value for ${vName}`}
                            onChange={(e) =>
                              setPreviewVariables({ ...previewVariables, [vName]: e.target.value })
                            }
                          />
                        </div>
                      );
                    })}

                    {blocks.filter((b) => b.content.match(/\{\{/)).length === 0 && (
                      <div className="text-center text-gray-400 text-sm py-4 italic">
                        No variables detected
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </DragDropContext>
      </div>
    </div>
  );
};

export default PromptBuilder;
