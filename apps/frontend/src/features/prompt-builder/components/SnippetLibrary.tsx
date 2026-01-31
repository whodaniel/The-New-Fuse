import { Draggable, Droppable } from '@hello-pangea/dnd';
import { PromptBlock } from '@the-new-fuse/prompt-templating';
import { Brain, ChevronDown, ChevronRight, Search, Shield, Type } from 'lucide-react';
import React, { useState } from 'react';

// Mock data types for the library
interface LibraryCategory {
  id: string;
  title: string;
  icon: React.ElementType;
  items: Partial<PromptBlock>[];
}

const LIBRARY_CATEGORIES: LibraryCategory[] = [
  {
    id: 'roles',
    title: 'Roles & Personas',
    icon: Brain,
    items: [
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
  },
  {
    id: 'structure',
    title: 'Structure',
    icon: Type,
    items: [
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
  },
  {
    id: 'safety',
    title: 'Safety & Guardrails',
    icon: Shield,
    items: [
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
  },
];

export const SnippetLibrary: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({
    roles: true,
    structure: true,
    safety: false,
  });

  const toggleCategory = (id: string) => {
    setExpandedCategories((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="w-80 bg-white border-r border-gray-200 flex flex-col h-full shadow-lg z-10">
      <div className="p-4 border-b border-gray-200">
        <h2 className="font-semibold text-gray-800 mb-2">Snippet Library</h2>
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search snippets..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-4 py-2 text-sm bg-gray-50 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {LIBRARY_CATEGORIES.map((category) => (
          <div key={category.id} className="select-none">
            <button
              onClick={() => toggleCategory(category.id)}
              className="flex items-center w-full mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider hover:text-gray-700"
            >
              {expandedCategories[category.id] ? (
                <ChevronDown size={14} />
              ) : (
                <ChevronRight size={14} />
              )}
              <span className="ml-1">{category.title}</span>
            </button>

            {expandedCategories[category.id] && (
              <Droppable droppableId={`library-${category.id}`} isDropDisabled={true}>
                {(provided, snapshot) => (
                  <div ref={provided.innerRef} {...provided.droppableProps} className="space-y-2">
                    {category.items
                      .filter(
                        (item) =>
                          !searchTerm ||
                          (item.metadata?.name || '')
                            .toLowerCase()
                            .includes(searchTerm.toLowerCase())
                      )
                      .map((item, index) => (
                        <Draggable
                          key={`${category.id}-${index}`}
                          draggableId={`lib-${category.id}-${index}`}
                          index={index}
                        >
                          {(dragProvided, dragSnapshot) => (
                            <div
                              ref={dragProvided.innerRef}
                              {...dragProvided.draggableProps}
                              {...dragProvided.dragHandleProps}
                              className={`
                              p-3 rounded-md border border-gray-200 bg-white shadow-sm hover:border-blue-300 hover:shadow transition-all cursor-grab active:cursor-grabbing
                              ${dragSnapshot.isDragging ? 'opacity-50 ring-2 ring-blue-500 rotate-2' : ''}
                            `}
                            >
                              <div className="flex items-start gap-3">
                                <div
                                  className={`p-1.5 rounded-md ${
                                    item.type === 'system'
                                      ? 'bg-purple-100 text-purple-600'
                                      : item.type === 'user'
                                        ? 'bg-blue-100 text-blue-600'
                                        : item.type === 'variable'
                                          ? 'bg-orange-100 text-orange-600'
                                          : 'bg-gray-100 text-gray-600'
                                  }`}
                                >
                                  <category.icon size={16} />
                                </div>
                                <div>
                                  <h4 className="text-sm font-medium text-gray-900">
                                    {item.metadata?.name || 'Snippet'}
                                  </h4>
                                  <p className="text-xs text-gray-500 line-clamp-2 mt-0.5">
                                    {item.content}
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}
                        </Draggable>
                      ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
