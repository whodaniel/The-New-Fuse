import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  Label,
} from '@/components/ui';
import { aiSourceService } from '@/services/aiSource.service';
import { Cpu, Wifi, WifiOff } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

const LOOPBACK_DEFAULT = 'http://127.0.0.1:43120';

/**
 * Lets a user point AI Assist at their own AI relay.
 *
 * By default AI Assist looks for a relay on this machine at :43120, which works in Chromium
 * browsers. Safari and Firefox refuse requests from an https: page to a loopback address, and some
 * users run the relay on a different machine entirely — both cases need an https:// URL (typically
 * a tunnel), which is what this card configures.
 */
export function LocalRelaySettings() {
  const [relayUrl, setRelayUrl] = useState('');
  const [relayToken, setRelayToken] = useState('');
  const [error, setError] = useState('');
  const [testing, setTesting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<'online' | 'offline' | null>(null);

  useEffect(() => {
    setRelayUrl(aiSourceService.getCustomRelayUrl());
    setRelayToken(aiSourceService.getRelayAuthToken());
    // A relay configured in another browser should carry over rather than needing re-entry.
    void aiSourceService.hydrateCustomRelayUrlFromProfile().then((hydrated) => {
      if (hydrated) setRelayUrl(hydrated);
    });
  }, []);

  const handleTest = async () => {
    setTesting(true);
    setError('');
    setStatus(null);
    try {
      aiSourceService.resetRelayProbe();
      // An empty field means "use the loopback default", which is what we should then be testing.
      const online = await aiSourceService.probeRelayHealth(relayUrl.trim() || LOOPBACK_DEFAULT);
      setStatus(online ? 'online' : 'offline');
      if (online) {
        toast.success('Relay reachable.');
      } else {
        toast.error('Could not reach that relay.');
      }
    } finally {
      setTesting(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      aiSourceService.setCustomRelayUrl(relayUrl);
      // Token stays on this device — only the URL is synced to the profile.
      aiSourceService.setRelayAuthToken(relayToken);
      const synced = await aiSourceService.syncCustomRelayUrlToProfile(relayUrl.trim());
      toast.success(
        synced
          ? 'Relay URL saved.'
          : 'Relay URL saved on this device (could not sync it to your profile).'
      );
    } catch (err: any) {
      const message = err?.message || 'Could not save that relay URL.';
      setError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const handleClear = async () => {
    setSaving(true);
    setError('');
    try {
      aiSourceService.clearCustomRelayUrl();
      aiSourceService.setRelayAuthToken('');
      await aiSourceService.syncCustomRelayUrlToProfile('');
      setRelayUrl('');
      setRelayToken('');
      setStatus(null);
      toast.success(`Cleared. AI Assist will look for a relay at ${LOOPBACK_DEFAULT}.`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl flex items-center gap-2">
          <Cpu className="w-5 h-5" />
          Local AI Relay
        </CardTitle>
        <CardDescription>
          Run AI Assist on your own models (Ollama, LM Studio, or a local Gemini route) instead of
          TNF cloud providers. Leave this blank to use a relay on this machine at{' '}
          <code className="text-xs">{LOOPBACK_DEFAULT}</code>.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-2">
          <Label htmlFor="relay-url">Relay URL</Label>
          <Input
            id="relay-url"
            placeholder={LOOPBACK_DEFAULT}
            value={relayUrl}
            onChange={(e) => {
              setRelayUrl(e.target.value);
              setError('');
              setStatus(null);
            }}
          />
          {error ? <p className="text-sm text-red-500">{error}</p> : null}
          <p className="text-xs text-muted-foreground">
            A relay on another machine must use <code>https://</code> — browsers block insecure
            requests from this page. Safari and Firefox also block loopback addresses, so on those
            browsers an https:// URL (for example a Cloudflare Tunnel) is required.
          </p>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="relay-token">Relay Auth Token (optional)</Label>
          <Input
            id="relay-token"
            type="password"
            autoComplete="off"
            placeholder="Only if you started the relay with RELAY_AUTH_TOKEN"
            value={relayToken}
            onChange={(e) => setRelayToken(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            Stored on this device only, never synced to your account. Leave blank unless your relay
            requires it.
          </p>
        </div>

        {status ? (
          <div
            className={`flex items-center gap-2 text-sm ${
              status === 'online' ? 'text-emerald-500' : 'text-amber-500'
            }`}
          >
            {status === 'online' ? <Wifi className="h-4 w-4" /> : <WifiOff className="h-4 w-4" />}
            {status === 'online'
              ? 'Relay is reachable from this browser.'
              : 'No relay responded. Check that it is running and reachable at that URL.'}
          </div>
        ) : null}

        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={handleClear} disabled={saving || !relayUrl}>
            Clear
          </Button>
          <Button variant="outline" onClick={handleTest} disabled={testing}>
            {testing ? 'Testing...' : 'Test Connection'}
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save Relay URL'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default LocalRelaySettings;
