import React from 'react';
import { ExportButton } from './ExportButton.js';

export default {
  title: 'Components/ExportButton',
  component: ExportButton,
};

const sampleConversation = `User: Hello!\nAssistant: Hi, how can I help you today?\nUser: Please export this conversation to PDF.\nAssistant: Sure!`;

export const Default = () => (
  <div style={{ maxWidth: 400 }}>
    <ExportButton conversation={sampleConversation} format="pdf" />
  </div>
);

export const Markdown = () => (
  <div style={{ maxWidth: 400 }}>
    <ExportButton conversation={sampleConversation} format="md" buttonLabel="Export as Markdown" />
  </div>
);

export const PlainText = () => (
  <div style={{ maxWidth: 400 }}>
    <ExportButton conversation={sampleConversation} format="txt" buttonLabel="Export as Plain Text" />
  </div>
);
