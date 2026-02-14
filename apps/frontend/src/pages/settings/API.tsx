import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import ProviderApiKeyList from "@/components/ApiKeyManagement/ProviderApiKeyList";
import { toast } from 'sonner';
import { apiService } from '@/services/api';

const URL_REGEX = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/;

export default function API() {
  const [tokens, setTokens] = useState<{ prefix: string; createdAt: string }[]>([]);
  const [tokenLoading, setTokenLoading] = useState({ generate: false, list: true });
  const [webhookUrl, setWebhookUrl] = useState('');
  const [webhookUrlError, setWebhookUrlError] = useState('');
  const [webhookLoading, setWebhookLoading] = useState({ save: false, test: false, get: true });

  useEffect(() => {
    fetchTokens();
    fetchWebhookUrl();
  }, []);

  const fetchTokens = async () => {
    try {
      const fetchedTokens = await apiService.getPersonalAccessTokens();
      setTokens(fetchedTokens);
    } catch (error) {
      console.error(error);
      toast.error('Failed to fetch tokens');
    } finally {
      setTokenLoading(prev => ({ ...prev, list: false }));
    }
  };

  const fetchWebhookUrl = async () => {
    try {
      const data = await apiService.getWebhookUrl();
      if (data.url) {
        setWebhookUrl(data.url);
      }
    } catch (error) {
      console.error(error);
      toast.error('Failed to fetch webhook URL');
    } finally {
      setWebhookLoading(prev => ({ ...prev, get: false }));
    }
  };

  const handleGenerateToken = async () => {
    setTokenLoading(prev => ({ ...prev, generate: true }));
    try {
      const newToken = await apiService.generatePersonalAccessToken();
      setTokens([...tokens, { prefix: newToken.prefix, createdAt: newToken.createdAt }]);
      toast.success('Token generated successfully', {
        description: `Your new token: ${newToken.token}. Please save it somewhere safe.`,
      });
    } catch (error) {
      console.error(error);
      toast.error('Failed to generate token');
    } finally {
      setTokenLoading(prev => ({ ...prev, generate: false }));
    }
  };

  const handleRevokeToken = async (prefix: string) => {
    try {
      await apiService.revokePersonalAccessToken(prefix);
      setTokens(tokens.filter((token) => token.prefix !== prefix));
      toast.success('Token revoked successfully');
    } catch (error) {
      console.error(error);
      toast.error('Failed to revoke token');
    }
  };

  const validateWebhookUrl = () => {
    if (!webhookUrl || !URL_REGEX.test(webhookUrl)) {
      setWebhookUrlError('Please enter a valid URL.');
      return false;
    }
    setWebhookUrlError('');
    return true;
  };

  const handleSaveWebhook = async () => {
    if (!validateWebhookUrl()) return;
    setWebhookLoading({ ...webhookLoading, save: true });
    try {
      await apiService.saveWebhookUrl(webhookUrl);
      toast.success('Webhook URL saved successfully');
    } catch (error) {
      console.error(error);
      toast.error('Failed to save webhook URL');
    } finally {
      setWebhookLoading({ ...webhookLoading, save: false });
    }
  };

  const handleTestWebhook = async () => {
    if (!validateWebhookUrl()) return;
    setWebhookLoading({ ...webhookLoading, test: true });
    try {
      const result = await apiService.testWebhookUrl(webhookUrl);
      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error(error);
      toast.error('Failed to test webhook');
    } finally {
      setWebhookLoading({ ...webhookLoading, test: false });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">API Settings</h3>
        <p className="text-sm text-muted-foreground">
          Manage your API keys and integrations
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Personal Access Tokens</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={handleGenerateToken} disabled={tokenLoading.generate}>
              {tokenLoading.generate ? 'Generating...' : 'Generate New Token'}
            </Button>
          </div>
          <div className="border rounded-md">
            {tokenLoading.list ? (
              <p className="p-4 text-sm text-muted-foreground">Loading tokens...</p>
            ) : tokens.length === 0 ? (
              <p className="p-4 text-sm text-muted-foreground">No tokens generated yet.</p>
            ) : (
              <ul className="divide-y">
                {tokens.map(({ prefix, createdAt }) => (
                  <li key={prefix} className="flex items-center justify-between p-4">
                    <div>
                      <span className="font-mono">{prefix}</span>
                      <p className="text-sm text-muted-foreground">
                        Created on {new Date(createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <Button variant="destructive" onClick={() => handleRevokeToken(prefix)}>
                      Revoke
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </CardContent>
      </Card>
      
      <ProviderApiKeyList />

      <Card>
        <CardHeader>
          <CardTitle>Webhooks</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {webhookLoading.get ? (
            <p className="text-sm text-muted-foreground">Loading webhook configuration...</p>
          ) : (
            <>
              <div className="grid gap-2">
                <Label htmlFor="webhook-url">Webhook URL</Label>
                <Input
                  id="webhook-url"
                  placeholder="https://"
                  value={webhookUrl}
                  onChange={(e) => setWebhookUrl(e.target.value)}
                />
                {webhookUrlError && <p className="text-sm text-red-500">{webhookUrlError}</p>}
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={handleTestWebhook} disabled={webhookLoading.test}>
                  {webhookLoading.test ? 'Testing...' : 'Test Webhook'}
                </Button>
                <Button onClick={handleSaveWebhook} disabled={webhookLoading.save}>
                  {webhookLoading.save ? 'Saving...' : 'Save Webhook'}
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
