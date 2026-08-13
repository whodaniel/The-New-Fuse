import { Label } from '@/components/ui';
import { GlassCard as Card } from '@/components/ui/premium/GlassCard';
import { PremiumButton as Button } from '@/components/ui/premium/PremiumButton';
import { PremiumInput as Input } from '@/components/ui/premium/PremiumInput';
import { useState } from 'react';
import { webSocketService } from '../services/websocket';
('use client');

export function WebhookManager() {
  const [webhookUrl, setWebhookUrl] = useState('');

  const handleAddWebhook = () => {
    if (webhookUrl) {
      webSocketService.send('addWebhook', { url: webhookUrl });
      setWebhookUrl('');
    }
  };

  return (
    <Card title="Webhook Manager" gradient="orange" className="w-full max-w-md">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="webhookUrl" className="text-white">
            Webhook URL
          </Label>
          <Input
            id="webhookUrl"
            value={webhookUrl}
            onChange={(e) => setWebhookUrl(e.target.value)}
            placeholder="https://example.com/webhook"
          />
        </div>
        <Button onClick={handleAddWebhook} fullWidth variant="gradient">
          Add Webhook
        </Button>
      </div>
    </Card>
  );
}
