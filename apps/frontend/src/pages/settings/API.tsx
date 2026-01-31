import ProviderApiKeyList from '@/components/ApiKeyManagement/ProviderApiKeyList';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Key, Shield, Webhook } from 'lucide-react';

export default function API() {
  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <div>
        <h3 className="text-2xl font-bold tracking-tight mb-2">API & Integrations</h3>
        <p className="text-muted-foreground">
          Manage your API keys for AI providers and external services.
        </p>
      </div>

      <Alert
        variant="default"
        className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800"
      >
        <Shield className="h-4 w-4 text-blue-600 dark:text-blue-400" />
        <AlertTitle className="text-blue-800 dark:text-blue-300">Security Note</AlertTitle>
        <AlertDescription className="text-blue-700 dark:text-blue-400">
          Your API keys are encrypted at rest. We never share your keys with third parties except
          the respective providers when making requests on your behalf.
        </AlertDescription>
      </Alert>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl flex items-center gap-2">
                  <Key className="w-5 h-5" />
                  AI Provider Keys
                </CardTitle>
                <CardDescription>
                  Configure API keys for LLM providers to enable AI capabilities.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ProviderApiKeyList />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Personal Access Tokens
            </CardTitle>
            <CardDescription>
              Create tokens to authenticate with the Fuse API programmatically.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 text-center">
              <p className="text-slate-500 mb-4">
                You haven't generated any personal access tokens yet.
              </p>
              <Button>Generate New Token</Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
              <Webhook className="w-5 h-5" />
              Webhooks
            </CardTitle>
            <CardDescription>
              Configure webhooks to receive real-time updates about workspace events.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 max-w-xl">
              <div className="grid gap-2">
                <Label htmlFor="webhook-url">Endpoint URL</Label>
                <div className="flex gap-2">
                  <Input id="webhook-url" placeholder="https://api.your-app.com/webhooks/fuse" />
                  <Button variant="secondary">Test</Button>
                  <Button>Save</Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  We will send a POST request to this URL for configured events.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
