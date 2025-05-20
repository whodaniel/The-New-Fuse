"use strict";
'use client';
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebhookManager = WebhookManager;
import react_1 from 'react';
import card_1 from '@/components/ui/card';
import button_1 from '@/components/ui/button';
import input_1 from '@/components/ui/input';
import label_1 from '@/components/ui/label';
import websocket_1 from '../services/websocket.js';
function WebhookManager() {
    const [webhookUrl, setWebhookUrl] = (0, react_1.useState)('');
    const handleAddWebhook = () => {
        if (webhookUrl) {
            websocket_1.webSocketService.send('addWebhook', { url: webhookUrl });
            setWebhookUrl('');
        }
    };
    return (<card_1.Card className="w-full max-w-md">
      <card_1.CardHeader>
        <card_1.CardTitle>Webhook Manager</card_1.CardTitle>
      </card_1.CardHeader>
      <card_1.CardContent>
        <div className="space-y-4">
          <div className="space-y-2">
            <label_1.Label htmlFor="webhookUrl">Webhook URL</label_1.Label>
            <input_1.Input id="webhookUrl" value={webhookUrl} onChange={(e) => setWebhookUrl(e.target.value)} placeholder="https://example.com/webhook"/>
          </div>
          <button_1.Button onClick={handleAddWebhook} className="w-full">Add Webhook</button_1.Button>
        </div>
      </card_1.CardContent>
    </card_1.Card>);
}
export {};
//# sourceMappingURL=webhook-manager.js.map