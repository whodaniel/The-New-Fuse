import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { apiService } from '@/services/api';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

type AgentGrant = {
  id: string;
  agentId: string;
  provider: string;
  allowedModels: string[];
  maxRequestsPerMinute: number;
  dailyTokenBudget: number;
  monthlyUsdCap: number; // Stored in cents
  expiresAt: string;
  revoked: boolean;
};

export function AgentGrantList() {
  const [grants, setGrants] = useState<AgentGrant[]>([]);
  const [agentId, setAgentId] = useState('');
  const [provider, setProvider] = useState('');
  const [allowedModels, setAllowedModels] = useState('');
  const [expiresAt, setExpiresAt] = useState('');

  // Usage Controls
  const [maxRequests, setMaxRequests] = useState('30');
  const [dailyTokens, setDailyTokens] = useState('100000');
  const [monthlyBudget, setMonthlyBudget] = useState('10'); // In Dollars

  const [loading, setLoading] = useState({ list: true, create: false });
  const [newToken, setNewToken] = useState('');

  useEffect(() => {
    fetchGrants();
  }, []);

  const fetchGrants = async () => {
    try {
      const result = await apiService.getAgentApiGrants();
      setGrants(result);
    } catch (error) {
      toast.error('Failed to fetch agent grants');
    } finally {
      setLoading((prev) => ({ ...prev, list: false }));
    }
  };

  const handleCreate = async () => {
    if (!agentId.trim() || !provider.trim() || !expiresAt) {
      toast.error('Agent ID, provider, and expiry are required');
      return;
    }

    try {
      setLoading((prev) => ({ ...prev, create: true }));
      const created = await apiService.createAgentApiGrant({
        agentId: agentId.trim(),
        provider: provider.trim().toLowerCase(),
        allowedModels: allowedModels
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
        maxRequestsPerMinute: parseInt(maxRequests) || 30,
        dailyTokenBudget: parseInt(dailyTokens) || 100000,
        monthlyUsdCapCents: (parseFloat(monthlyBudget) || 10) * 100,
        expiresAt: new Date(expiresAt).toISOString(),
      });
      setNewToken(created.accessToken || '');
      setAgentId('');
      setProvider('');
      setAllowedModels('');
      setExpiresAt('');
      // Reset defaults
      setMaxRequests('30');
      setDailyTokens('100000');
      setMonthlyBudget('10');

      await fetchGrants();
      toast.success('Grant created. Copy token now.');
    } catch (error: any) {
      toast.error(error?.message || 'Failed to create grant');
    } finally {
      setLoading((prev) => ({ ...prev, create: false }));
    }
  };

  const handleRotate = async (id: string) => {
    try {
      const rotated = await apiService.rotateAgentApiGrant(id);
      setNewToken(rotated.accessToken || '');
      await fetchGrants();
      toast.success('Token rotated. Old tokens are invalid.');
    } catch (error) {
      toast.error('Failed to rotate token');
    }
  };

  const handleRevoke = async (id: string) => {
    try {
      await apiService.revokeAgentApiGrant(id);
      await fetchGrants();
      toast.success('Grant revoked');
    } catch (error) {
      toast.error('Failed to revoke grant');
    }
  };

  const copyToken = async () => {
    if (!newToken) return;
    await navigator.clipboard.writeText(newToken);
    toast.success('Copied token');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Agent API Grants & Usage Limits</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4 border p-4 rounded-md bg-muted/20">
          <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wider">
            New Grant Configuration
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="grant-agent-id">Agent ID</Label>
              <Input
                id="grant-agent-id"
                placeholder="agent-123"
                value={agentId}
                onChange={(e) => setAgentId(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="grant-provider">Provider</Label>
              <Input
                id="grant-provider"
                placeholder="openai, anthropic"
                value={provider}
                onChange={(e) => setProvider(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="grant-max-req">Max Req/Min</Label>
              <Input
                id="grant-max-req"
                type="number"
                value={maxRequests}
                onChange={(e) => setMaxRequests(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="grant-daily-tokens">Daily Token Limit</Label>
              <Input
                id="grant-daily-tokens"
                type="number"
                value={dailyTokens}
                onChange={(e) => setDailyTokens(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="grant-monthly-budget">Monthly Budget ($)</Label>
              <Input
                id="grant-monthly-budget"
                type="number"
                value={monthlyBudget}
                onChange={(e) => setMonthlyBudget(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="grant-models">Allowed Models (optional, csv)</Label>
              <Input
                id="grant-models"
                placeholder="gpt-4o, claude-3-5-sonnet"
                value={allowedModels}
                onChange={(e) => setAllowedModels(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="grant-expires">Expires At</Label>
              <Input
                id="grant-expires"
                type="datetime-local"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
              />
            </div>
          </div>

          <Button onClick={handleCreate} disabled={loading.create} className="w-full md:w-auto">
            {loading.create ? 'Creating Grant...' : 'Create & Issue Token'}
          </Button>
        </div>

        {newToken && (
          <div className="space-y-2 p-4 rounded border bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800">
            <Label className="text-yellow-800 dark:text-yellow-200 font-bold">
              New Grant Token (shown once, copy now)
            </Label>
            <div className="flex gap-2">
              <Input readOnly value={newToken} className="font-mono bg-transparent dark:bg-black" />
              <Button variant="outline" onClick={copyToken}>
                Copy
              </Button>
            </div>
          </div>
        )}

        <div className="border rounded-md">
          <div className="bg-muted p-3 border-b">
            <h4 className="font-medium text-sm">Active Grants</h4>
          </div>
          {loading.list ? (
            <p className="p-4 text-sm text-muted-foreground">Loading grants...</p>
          ) : grants.length === 0 ? (
            <p className="p-4 text-sm text-muted-foreground">No grants issued yet.</p>
          ) : (
            <ul className="divide-y max-h-[400px] overflow-y-auto">
              {grants.map((grant) => (
                <li key={grant.id} className="p-4 hover:bg-muted/50 transition-colors">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-lg">{grant.agentId}</span>
                        <span className="text-muted-foreground">→</span>
                        <span className="font-medium badge bg-secondary px-2 py-0.5 rounded text-sm">
                          {grant.provider}
                        </span>
                        {grant.revoked && (
                          <span className="bg-red-100 text-red-800 text-xs px-2 py-0.5 rounded">
                            Revoked
                          </span>
                        )}
                      </div>

                      <div className="text-sm grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-1 text-muted-foreground">
                        <span>Limit: {grant.maxRequestsPerMinute} req/min</span>
                        <span>Budget: ${(grant.monthlyUsdCap / 100).toFixed(2)}/mo</span>
                        <span>Tokens: {(grant.dailyTokenBudget / 1000).toFixed(0)}k/day</span>
                        <span>Exp: {new Date(grant.expiresAt).toLocaleDateString()}</span>
                      </div>

                      {grant.allowedModels.length > 0 && (
                        <div className="text-xs text-muted-foreground">
                          Models: {grant.allowedModels.join(', ')}
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2 shrink-0">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRotate(grant.id)}
                        disabled={grant.revoked}
                      >
                        Rotate
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleRevoke(grant.id)}
                        disabled={grant.revoked}
                      >
                        Revoke
                      </Button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
