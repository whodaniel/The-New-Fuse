import React, { useState } from 'react';
import { ExportButton } from './ExportButton.js';

const initialConversation = `User: Hello!\nAssistant: Hi, how can I help you today?\nUser: Please export this conversation to PDF.\nAssistant: Sure!`;

export const ConversationExportDemo: React.FC = () => {
  const [conversation, setConversation] = useState(initialConversation);

  return (
    <div className="max-w-xl mx-auto p-4 bg-card rounded shadow">
      <h2 className="text-lg font-semibold mb-2">Conversation Export Demo</h2>
      <textarea
        className="w-full h-32 p-2 border rounded mb-4 text-sm"
        value={conversation}
        onChange={e => setConversation(e.target.value)}
        aria-label="Conversation text"
      />
      <div className="flex gap-2">
        <ExportButton conversation={conversation} format="pdf" buttonLabel="Export to PDF" />
        <ExportButton conversation={conversation} format="md" buttonLabel="Export as Markdown" />
        <ExportButton conversation={conversation} format="txt" buttonLabel="Export as Text" />
      </div>
    </div>
  );
};
