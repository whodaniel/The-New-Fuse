// @ts-nocheck
import { Label, Textarea } from '@/components/ui';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui';
import { PremiumInput as Input } from '@/components/ui/premium/PremiumInput';
import React, { memo } from 'react';
import { NodeProps } from 'reactflow';
import { BaseNode } from './base-node';

const NotificationNode: React.FC<NodeProps> = memo(({ id, data, ...props }) => {
  // Handle notification title change
  const handleTitleChange = (title: string) => {
    if (data.onUpdate) {
      data.onUpdate({
        config: {
          ...data.config,
          title,
        },
      });
    }
  };

  // Handle notification message change
  const handleMessageChange = (message: string) => {
    if (data.onUpdate) {
      data.onUpdate({
        config: {
          ...data.config,
          message,
        },
      });
    }
  };

  // Handle notification type change
  const handleTypeChange = (type: string) => {
    if (data.onUpdate) {
      data.onUpdate({
        config: {
          ...data.config,
          type,
        },
      });
    }
  };

  // Handle notification channel change
  const handleChannelChange = (channel: string) => {
    if (data.onUpdate) {
      data.onUpdate({
        config: {
          ...data.config,
          channel,
        },
      });
    }
  };

  const inputHandles = [{ id: 'default', label: 'Input' }];

  const outputHandles = [{ id: 'default', label: 'Output' }];

  const renderContent = () => (
    <div className="space-y-3">
      <div className="space-y-1">
        <Label htmlFor={`notification-type-${id}`} className="text-xs font-medium text-slate-200">
          Notification Type
        </Label>
        <Select value={data.config?.type || 'info'} onValueChange={handleTypeChange}>
          <SelectTrigger
            id={`notification-type-${id}`}
            className="h-9 text-xs mt-1.5 bg-slate-700 border-slate-600 text-white hover:bg-slate-600"
          >
            <SelectValue placeholder="Select type" />
          </SelectTrigger>
          <SelectContent className="bg-slate-800 border-slate-600">
            <SelectItem
              value="info"
              className="text-xs text-white hover:bg-slate-700 focus:bg-slate-700"
            >
              ℹ️ Info
            </SelectItem>
            <SelectItem
              value="success"
              className="text-xs text-white hover:bg-slate-700 focus:bg-slate-700"
            >
              ✅ Success
            </SelectItem>
            <SelectItem
              value="warning"
              className="text-xs text-white hover:bg-slate-700 focus:bg-slate-700"
            >
              ⚠️ Warning
            </SelectItem>
            <SelectItem
              value="error"
              className="text-xs text-white hover:bg-slate-700 focus:bg-slate-700"
            >
              ❌ Error
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1">
        <Label
          htmlFor={`notification-channel-${id}`}
          className="text-xs font-medium text-slate-200"
        >
          Channel
        </Label>
        <Select value={data.config?.channel || 'ui'} onValueChange={handleChannelChange}>
          <SelectTrigger
            id={`notification-channel-${id}`}
            className="h-9 text-xs mt-1.5 bg-slate-700 border-slate-600 text-white hover:bg-slate-600"
          >
            <SelectValue placeholder="Select channel" />
          </SelectTrigger>
          <SelectContent className="bg-slate-800 border-slate-600">
            <SelectItem
              value="ui"
              className="text-xs text-white hover:bg-slate-700 focus:bg-slate-700"
            >
              💬 UI Toast
            </SelectItem>
            <SelectItem
              value="email"
              className="text-xs text-white hover:bg-slate-700 focus:bg-slate-700"
            >
              📧 Email
            </SelectItem>
            <SelectItem
              value="slack"
              className="text-xs text-white hover:bg-slate-700 focus:bg-slate-700"
            >
              💬 Slack
            </SelectItem>
            <SelectItem
              value="webhook"
              className="text-xs text-white hover:bg-slate-700 focus:bg-slate-700"
            >
              🔗 Webhook
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1">
        <Label htmlFor={`notification-title-${id}`} className="text-xs font-medium text-slate-200">
          Title
        </Label>
        <Input
          id={`notification-title-${id}`}
          className="h-9 text-xs bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
          placeholder="Notification Title"
          value={data.config?.title || ''}
          onChange={(e: any) => handleTitleChange(e.target.value)}
        />
      </div>

      <div className="space-y-1">
        <Label
          htmlFor={`notification-message-${id}`}
          className="text-xs font-medium text-slate-200"
        >
          Message
        </Label>
        <Textarea
          id={`notification-message-${id}`}
          className="h-24 text-xs resize-none bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
          placeholder="Notification message..."
          value={data.config?.message || ''}
          onChange={(e: any) => handleMessageChange(e.target.value)}
        />
        <p className="text-xs text-slate-300 leading-relaxed">
          You can use template variables like {'{{ variable }}'} in your message.
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
        renderContent,
      }}
      inputHandles={inputHandles}
      outputHandles={outputHandles}
      {...props}
    />
  );
});

NotificationNode.displayName = 'NotificationNode';

export { NotificationNode };
