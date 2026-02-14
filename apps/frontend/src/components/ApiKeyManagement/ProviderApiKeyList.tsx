import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { apiService } from '@/services/api';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

interface ApiKey {
  id: string;
  provider: string;
}

export function ProviderApiKeyList() {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [provider, setProvider] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [loading, setLoading] = useState({ save: false, list: true });

  useEffect(() => {
    fetchApiKeys();
  }, []);

  const fetchApiKeys = async () => {
    try {
      const keys = await apiService.getProviderApiKeys();
      setApiKeys(keys);
    } catch (error) {
      console.error(error);
      toast.error('Failed to fetch provider API keys');
    } finally {
      setLoading((prev) => ({ ...prev, list: false }));
    }
  };

  const handleSaveApiKey = async () => {
    if (!provider || !apiKey) {
      toast.error('Provider and API Key are required.');
      return;
    }
    setLoading((prev) => ({ ...prev, save: true }));
    try {
      const newKey = await apiService.saveProviderApiKey(provider, apiKey);
      setApiKeys([...apiKeys, newKey]);
      setProvider('');
      setApiKey('');
      toast.success(`API key for ${provider} saved successfully`);
    } catch (error: any) {
      toast.error(error.message || 'Failed to save API key');
    } finally {
      setLoading((prev) => ({ ...prev, save: false }));
    }
  };

  const handleDeleteApiKey = async (id: string) => {
    try {
      await apiService.deleteProviderApiKey(id);
      setApiKeys(apiKeys.filter((key) => key.id !== id));
      toast.success('API key deleted successfully');
    } catch (error) {
      console.error(error);
      toast.error('Failed to delete API key');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Provider API Keys</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="provider">Provider</Label>
            <Input
              id="provider"
              placeholder="e.g. OpenAI"
              value={provider}
              onChange={(e) => setProvider(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="api-key-provider">API Key</Label>
            <Input
              id="api-key-provider"
              type="password"
              placeholder="Enter your API key"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
            />
          </div>
          <div className="flex items-end">
            <Button onClick={handleSaveApiKey} disabled={loading.save}>
              {loading.save ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </div>
        <div className="border rounded-md">
          {loading.list ? (
            <p className="p-4 text-sm text-muted-foreground">Loading API keys...</p>
          ) : apiKeys.length === 0 ? (
            <p className="p-4 text-sm text-muted-foreground">No API keys added yet.</p>
          ) : (
            <ul className="divide-y">
              {apiKeys.map(({ id, provider }) => (
                <li key={id} className="flex items-center justify-between p-4">
                  <div>
                    <span className="font-semibold">{provider}</span>
                  </div>
                  <Button variant="destructive" onClick={() => handleDeleteApiKey(id)}>
                    Delete
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
