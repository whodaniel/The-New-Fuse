import React from 'react';
import { FaRobot, FaTools, FaCode, FaDatabase, FaGlobe, FaWaveSquare, FaBell, FaSearch, FaFileAlt, FaMemory } from 'react-icons/fa';
import { FileText } from 'lucide-react';

// Import the new prompt template node
import { PromptTemplateNode } from '@the-new-fuse/prompt-templating';

// Standard workflow node component
export const StandardNode = ({ data }) => {
  return (
    <div className="px-4 py-2 shadow-md rounded-md bg-white border-2 border-stone-400">
      <div className="flex">
        <div className="rounded-full w-12 h-12 flex justify-center items-center bg-gray-100">
          {data.icon && <data.icon />}
        </div>
        <div className="ml-2">
          <div className="text-lg font-bold">{data.label}</div>
          <div className="text-gray-500">{data.description}</div>
        </div>
      </div>
    </div>
  );
};

// LLM Node for AI completions
export const LLMNode = ({ data }) => {
  return (
    <div className="px-4 py-2 shadow-md rounded-md bg-blue-50 border-2 border-blue-400">
      <div className="flex">
        <div className="rounded-full w-12 h-12 flex justify-center items-center bg-blue-100">
          <FaRobot className="text-blue-600" />
        </div>
        <div className="ml-2">
          <div className="text-lg font-bold text-blue-800">{data.label}</div>
          <div className="text-blue-600">{data.model || 'Default Model'}</div>
        </div>
      </div>
    </div>
  );
};

// Tool Node for AI tool execution
export const ToolNode = ({ data }) => {
  return (
    <div className="px-4 py-2 shadow-md rounded-md bg-green-50 border-2 border-green-400">
      <div className="flex">
        <div className="rounded-full w-12 h-12 flex justify-center items-center bg-green-100">
          <FaTools className="text-green-600" />
        </div>
        <div className="ml-2">
          <div className="text-lg font-bold text-green-800">{data.label}</div>
          <div className="text-green-600">{data.tool || 'Select Tool'}</div>
        </div>
      </div>
    </div>
  );
};

// Data Transform Node
export const TransformNode = ({ data }) => {
  return (
    <div className="px-4 py-2 shadow-md rounded-md bg-yellow-50 border-2 border-yellow-400">
      <div className="flex">
        <div className="rounded-full w-12 h-12 flex justify-center items-center bg-yellow-100">
          <FaCode className="text-yellow-600" />
        </div>
        <div className="ml-2">
          <div className="text-lg font-bold text-yellow-800">{data.label}</div>
          <div className="text-yellow-600">{data.transform || 'Transform Data'}</div>
        </div>
      </div>
    </div>
  );
};

// Data Source Node
export const DataNode = ({ data }) => {
  return (
    <div className="px-4 py-2 shadow-md rounded-md bg-purple-50 border-2 border-purple-400">
      <div className="flex">
        <div className="rounded-full w-12 h-12 flex justify-center items-center bg-purple-100">
          <FaDatabase className="text-purple-600" />
        </div>
        <div className="ml-2">
          <div className="text-lg font-bold text-purple-800">{data.label}</div>
          <div className="text-purple-600">{data.source || 'Data Source'}</div>
        </div>
      </div>
    </div>
  );
};

// Storage Node
export const StorageNode = ({ data }) => {
  return (
    <div className="px-4 py-2 shadow-md rounded-md bg-indigo-50 border-2 border-indigo-400">
      <div className="flex">
        <div className="rounded-full w-12 h-12 flex justify-center items-center bg-indigo-100">
          <FaMemory className="text-indigo-600" />
        </div>
        <div className="ml-2">
          <div className="text-lg font-bold text-indigo-800">{data.label}</div>
          <div className="text-indigo-600">{data.storage || 'Store Data'}</div>
        </div>
      </div>
    </div>
  );
};

// API Node
export const APINode = ({ data }) => {
  return (
    <div className="px-4 py-2 shadow-md rounded-md bg-cyan-50 border-2 border-cyan-400">
      <div className="flex">
        <div className="rounded-full w-12 h-12 flex justify-center items-center bg-cyan-100">
          <FaGlobe className="text-cyan-600" />
        </div>
        <div className="ml-2">
          <div className="text-lg font-bold text-cyan-800">{data.label}</div>
          <div className="text-cyan-600">{data.endpoint || 'API Endpoint'}</div>
        </div>
      </div>
    </div>
  );
};

// Webhook Node
export const WebhookNode = ({ data }) => {
  return (
    <div className="px-4 py-2 shadow-md rounded-md bg-orange-50 border-2 border-orange-400">
      <div className="flex">
        <div className="rounded-full w-12 h-12 flex justify-center items-center bg-orange-100">
          <FaWaveSquare className="text-orange-600" />
        </div>
        <div className="ml-2">
          <div className="text-lg font-bold text-orange-800">{data.label}</div>
          <div className="text-orange-600">{data.webhook || 'Webhook URL'}</div>
        </div>
      </div>
    </div>
  );
};

// Notification Node
export const NotificationNode = ({ data }) => {
  return (
    <div className="px-4 py-2 shadow-md rounded-md bg-red-50 border-2 border-red-400">
      <div className="flex">
        <div className="rounded-full w-12 h-12 flex justify-center items-center bg-red-100">
          <FaBell className="text-red-600" />
        </div>
        <div className="ml-2">
          <div className="text-lg font-bold text-red-800">{data.label}</div>
          <div className="text-red-600">{data.channel || 'Notification Channel'}</div>
        </div>
      </div>
    </div>
  );
};

// Vector Store Node
export const VectorStoreNode = ({ data }) => {
  return (
    <div className="px-4 py-2 shadow-md rounded-md bg-emerald-50 border-2 border-emerald-400">
      <div className="flex">
        <div className="rounded-full w-12 h-12 flex justify-center items-center bg-emerald-100">
          <FaSearch className="text-emerald-600" />
        </div>
        <div className="ml-2">
          <div className="text-lg font-bold text-emerald-800">{data.label}</div>
          <div className="text-emerald-600">{data.vectorStore || 'Vector Database'}</div>
        </div>
      </div>
    </div>
  );
};

// Document Processing Node
export const DocumentProcessingNode = ({ data }) => {
  return (
    <div className="px-4 py-2 shadow-md rounded-md bg-slate-50 border-2 border-slate-400">
      <div className="flex">
        <div className="rounded-full w-12 h-12 flex justify-center items-center bg-slate-100">
          <FaFileAlt className="text-slate-600" />
        </div>
        <div className="ml-2">
          <div className="text-lg font-bold text-slate-800">{data.label}</div>
          <div className="text-slate-600">{data.processor || 'Document Processor'}</div>
        </div>
      </div>
    </div>
  );
};

// Condition Node
export const ConditionNode = ({ data }) => {
  return (
    <div className="px-4 py-2 shadow-md rounded-md bg-amber-50 border-2 border-amber-400">
      <div className="flex">
        <div className="rounded-full w-12 h-12 flex justify-center items-center bg-amber-100">
          <FaCode className="text-amber-600" />
        </div>
        <div className="ml-2">
          <div className="text-lg font-bold text-amber-800">{data.label}</div>
          <div className="text-amber-600">{data.condition || 'If/Then Logic'}</div>
        </div>
      </div>
    </div>
  );
};

// Export all node types for ReactFlow
export const nodeTypes = {
  default: StandardNode,
  llm: LLMNode,
  tool: ToolNode,
  transform: TransformNode,
  data: DataNode,
  storage: StorageNode,
  api: APINode,
  webhook: WebhookNode,
  notification: NotificationNode,
  vectorStore: VectorStoreNode,
  documentProcessing: DocumentProcessingNode,
  condition: ConditionNode,
  promptTemplate: PromptTemplateNode, // Add the new prompt template node
};

export default nodeTypes;
