import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from './dialog.js';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './table.js';
import { Button } from './button.js';
import { Input } from './input.js';
import { Label } from './label.js';
import { toast } from './toast.js';

interface WebhookConfig {
  url: string;
  events: string[];
  secret?: string;
  headers?: Record<string, string>;
  retryConfig?: {
    maxAttempts: number;
    backoffMs: number;
  };
}

interface Props {
  toolName: string;
  webhooks: WebhookConfig[];
  onRegisterWebhook: (config: WebhookConfig) => Promise<void>;
  onRemoveWebhook: (webhookId: string) => Promise<void>;
}

export function WebhookConfigurationUI({
  toolName,
  webhooks,
  onRegisterWebhook,
  onRemoveWebhook,
}: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [newWebhook, setNewWebhook] = useState<Partial<WebhookConfig>>({
    events: ['*']
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWebhook.url) {
      toast({
        title: "Error",
        description: "Webhook URL is required",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await onRegisterWebhook(newWebhook as WebhookConfig);
      setIsOpen(false);
      setNewWebhook({ events: ['*'] });
      toast({
        title: "Success",
        description: "Webhook registered successfully"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Webhooks for {toolName}</h3>
        <Button onClick={() => setIsOpen(true)}>Add Webhook</Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>URL</TableHead>
            <TableHead>Events</TableHead>
            <TableHead>Secret</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {webhooks.map((webhook, index) => (
            <TableRow key={index}>
              <TableCell>{webhook.url}</TableCell>
              <TableCell>{webhook.events.join(', ')}</TableCell>
              <TableCell>{webhook.secret ? '••••••••' : 'None'}</TableCell>
              <TableCell>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => onRemoveWebhook(webhook.url)}
                >
                  Remove
                </Button>
              </TableCell>
            </TableRow>
          ))}
          {webhooks.length === 0 && (
            <TableRow>
              <TableCell colSpan={4} className="text-center text-muted-foreground">
                No webhooks configured
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Webhook</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="url">Webhook URL</Label>
              <Input
                id="url"
                value={newWebhook.url || ''}
                onChange={e => setNewWebhook(prev => ({ ...prev, url: e.target.value }))}
                placeholder="https://example.com/webhook"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="events">Events (comma-separated)</Label>
              <Input
                id="events"
                value={newWebhook.events?.join(', ') || ''}
                onChange={e => setNewWebhook(prev => ({
                  ...prev,
                  events: e.target.value.split(',').map(e => e.trim())
                }))}
                placeholder="success, error, *"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="secret">Webhook Secret (optional)</Label>
              <Input
                id="secret"
                type="password"
                value={newWebhook.secret || ''}
                onChange={e => setNewWebhook(prev => ({ ...prev, secret: e.target.value }))}
                placeholder="Enter webhook secret"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="maxAttempts">Max Retry Attempts</Label>
              <Input
                id="maxAttempts"
                type="number"
                min="1"
                max="10"
                value={newWebhook.retryConfig?.maxAttempts || 3}
                onChange={e => setNewWebhook(prev => ({
                  ...prev,
                  retryConfig: {
                    ...prev.retryConfig,
                    maxAttempts: parseInt(e.target.value)
                  }
                }))}
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Adding...' : 'Add Webhook'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}