import React, { memo } from 'react';
import { NodeProps } from 'reactflow';
import { BaseNode } from './base-node.js';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

const NotificationNode: React.React.FC<NodeProps> = memo(({ id, data }) => {
  // Handle notification title change
  const handleTitleChange = (title: string) => {
    if (data.onUpdate) {
      data.onUpdate({
        config: {
          ...data.config,
          title
        }
      });
    }
  };
  
  // Handle notification message change
  const handleMessageChange = (message: string) => {
    if (data.onUpdate) {
      data.onUpdate({
        config: {
          ...data.config,
          message
        }
      });
    }
  };
  
  // Handle notification type change
  const handleTypeChange = (type: string) => {
    if (data.onUpdate) {
      data.onUpdate({
        config: {
          ...data.config,
          type
        }
      });
    }
  };
  
  // Handle notification channel change
  const handleChannelChange = (channel: string) => {
    if (data.onUpdate) {
      data.onUpdate({
        config: {
          ...data.config,
          channel
        }
      });
    }
  };
  
  const inputHandles = [
    { id: 'default', label: 'Input' }
  ];
  
  const outputHandles = [
    { id: 'default', label: 'Output' }
  ];
  
  const renderContent = () => (
    <div className="space-y-3">
      <div className="space-y-1">
        <Label htmlFor={`notification-type-${id}`} className="text-xs">Notification Type</Label>
        <select
          id={`notification-type-${id}`}
          className="w-full text-xs h-8 rounded-md border border-input"
          value={data.config?.type || 'info'}
          onChange={(e: any) => handleTypeChange(e.target.value)}
        >
          <option value="info">Info</option>
          <option value="success">Success</option>
          <option value="warning">Warning</option>
          <option value="error">Error</option>
        </select>
      </div>
      
      <div className="space-y-1">
        <Label htmlFor={`notification-channel-${id}`} className="text-xs">Channel</Label>
        <select
          id={`notification-channel-${id}`}
          className="w-full text-xs h-8 rounded-md border border-input"
          value={data.config?.channel || 'ui'}
          onChange={(e: any) => handleChannelChange(e.target.value)}
        >
          <option value="ui">UI Toast</option>
          <option value="email">Email</option>
          <option value="slack">Slack</option>
          <option value="webhook">Webhook</option>
        </select>
      </div>
      
      <div className="space-y-1">
        <Label htmlFor={`notification-title-${id}`} className="text-xs">Title</Label>
        <Input
          id={`notification-title-${id}`}
          className="h-7 text-xs"
          placeholder="Notification Title"
          value={data.config?.title || ''}
          onChange={(e: any) => handleTitleChange(e.target.value)}
        />
      </div>
      
      <div className="space-y-1">
        <Label htmlFor={`notification-message-${id}`} className="text-xs">Message</Label>
        <Textarea
          id={`notification-message-${id}`}
          className="h-20 text-xs resize-none"
          placeholder="Notification message..."
          value={data.config?.message || ''}
          onChange={(e: any) => handleMessageChange(e.target.value)}
        />
        <p className="text-xs text-muted-foreground mt-1">
          You can use template variables like {{variable}} in your message.
        </p>
      </div>
    </div>
  );
  
  return (
    <BaseNode
      id={id}
      data={{
        ...data,
        name: data.name || 'Notification',
        type: 'notification',
        renderContent
      }}
      inputHandles={inputHandles}
      outputHandles={outputHandles}
    />
  );
});

NotificationNode.displayName = 'NotificationNode';

export { NotificationNode };
