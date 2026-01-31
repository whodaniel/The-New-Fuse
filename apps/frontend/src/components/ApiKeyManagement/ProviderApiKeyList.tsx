import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function ProviderApiKeyList() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Provider API Keys</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>Provider</Label>
              <Input placeholder="e.g. OpenAI" />
            </div>
            <div>
              <Label>API Key</Label>
              <Input type="password" placeholder="Enter your API key" />
            </div>
            <div className="flex items-end">
              <Button className="w-full">Save Key</Button>
            </div>
          </div>
          <div className="border rounded-md p-4 bg-slate-50 dark:bg-slate-900/20">
            <p className="text-sm text-muted-foreground">
              No API keys added yet. Add your keys to enable AI agent capabilities.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
