import { useMemo, useState } from 'react';

type ProviderKey = 'openai-codex' | 'anthropic' | 'google-antigravity' | 'kilo';

const providerDefaults: Record<
  ProviderKey,
  {
    primaryModel: string;
    fallbackModels: string;
    accessPath: string;
    refreshPath: string;
    accountPath: string;
  }
> = {
  'openai-codex': {
    primaryModel: 'openai-codex/gpt-5.3-codex',
    fallbackModels: 'openai-codex/gpt-5.1-codex,openai-codex/gpt-5-mini',
    accessPath: '.tokens.access_token',
    refreshPath: '.tokens.refresh_token',
    accountPath: '.tokens.account_id',
  },
  anthropic: {
    primaryModel: 'anthropic/claude-sonnet-4.5',
    fallbackModels: 'anthropic/claude-opus-4.1',
    accessPath: '.tokens.access_token',
    refreshPath: '.tokens.refresh_token',
    accountPath: '.tokens.account_id',
  },
  'google-antigravity': {
    primaryModel: 'google-antigravity/gemini-2.5-pro',
    fallbackModels: 'google-antigravity/gemini-2.0-flash',
    accessPath: '.tokens.access_token',
    refreshPath: '.tokens.refresh_token',
    accountPath: '.tokens.account_id',
  },
  kilo: {
    primaryModel: 'kilo/z-ai/glm-5:free',
    fallbackModels: 'kilo/minimax/minimax-m2.5:free',
    accessPath: '.tokens.access_token',
    refreshPath: '.tokens.refresh_token',
    accountPath: '.tokens.account_id',
  },
};

export function OAuthInstanceRotationControl() {
  const [service, setService] = useState('openclaw-cloud');
  const [provider, setProvider] = useState<ProviderKey>('openai-codex');
  const [authFile, setAuthFile] = useState('~/.codex-tenants/proof-tenant-a/auth.json');
  const [primaryModel, setPrimaryModel] = useState(providerDefaults['openai-codex'].primaryModel);
  const [fallbackModels, setFallbackModels] = useState(
    providerDefaults['openai-codex'].fallbackModels
  );
  const [accessPath, setAccessPath] = useState(providerDefaults['openai-codex'].accessPath);
  const [refreshPath, setRefreshPath] = useState(providerDefaults['openai-codex'].refreshPath);
  const [accountPath, setAccountPath] = useState(providerDefaults['openai-codex'].accountPath);
  const [tenantId, setTenantId] = useState('tnf-prod');
  const [saving, setSaving] = useState(false);
  const [executing, setExecuting] = useState(false);
  const [apiMessage, setApiMessage] = useState<string | null>(null);
  const [accessToken, setAccessToken] = useState('');
  const [refreshToken, setRefreshToken] = useState('');
  const [accountId, setAccountId] = useState('');
  const [googleEmail, setGoogleEmail] = useState('');
  const [googleProjectId, setGoogleProjectId] = useState('');
  const [bindings, setBindings] = useState<
    Array<{
      key: string;
      tenantId: string;
      service: string;
      provider: string;
      hasAccountId: boolean;
      updatedAt: string;
      updatedBy: string | null;
    }>
  >([]);

  const oneShotCommand = useMemo(() => {
    return [
      'bash scripts/railway/sync-openclaw-oauth-instance.sh',
      `--service ${service}`,
      `--provider ${provider}`,
      `--auth-file "${authFile}"`,
      `--primary-model ${primaryModel}`,
      `--fallbacks "${fallbackModels}"`,
      `--access-path "${accessPath}"`,
      `--refresh-path "${refreshPath}"`,
      `--account-path "${accountPath}"`,
    ].join(' ');
  }, [
    accessPath,
    accountPath,
    authFile,
    fallbackModels,
    primaryModel,
    provider,
    refreshPath,
    service,
  ]);

  const configSnippet = useMemo(() => {
    return JSON.stringify(
      {
        name: `${service}-${provider}`,
        service,
        provider,
        authFile,
        primaryModel,
        fallbackModels,
        paths: {
          access: accessPath,
          refresh: refreshPath,
          account: accountPath,
        },
      },
      null,
      2
    );
  }, [
    accessPath,
    accountPath,
    authFile,
    fallbackModels,
    primaryModel,
    provider,
    refreshPath,
    service,
  ]);

  const verifyCommand = useMemo(() => {
    const checks = [
      '.OPENCLAW_MODEL_PRIMARY',
      '.OPENCLAW_AGENTS__DEFAULTS__MODEL__PRIMARY',
      '.OPENCLAW_MODEL_FALLBACKS',
    ];
    if (provider === 'openai-codex') {
      checks.unshift('.OPENAI_CODEX_ACCOUNT_ID', '.OPENCLAW_USE_CODEX_OAUTH');
    }
    return `railway variable list --service ${service} --json | jq -r '${checks.join(', ')}'`;
  }, [provider, service]);

  function applyProviderDefaults(nextProvider: ProviderKey) {
    setProvider(nextProvider);
    setPrimaryModel(providerDefaults[nextProvider].primaryModel);
    setFallbackModels(providerDefaults[nextProvider].fallbackModels);
    setAccessPath(providerDefaults[nextProvider].accessPath);
    setRefreshPath(providerDefaults[nextProvider].refreshPath);
    setAccountPath(providerDefaults[nextProvider].accountPath);
  }

  async function copy(text: string) {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // ignore clipboard failures
    }
  }

  async function loadBindings() {
    setApiMessage(null);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/admin/openclaw/oauth/bindings', {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      if (!res.ok) throw new Error(`Failed to load bindings (${res.status})`);
      const json = await res.json();
      setBindings(Array.isArray(json) ? json : []);
    } catch (err) {
      setApiMessage((err as Error).message);
    }
  }

  async function saveBinding() {
    setSaving(true);
    setApiMessage(null);
    try {
      const token = localStorage.getItem('token');
      if (!accessToken || !refreshToken) {
        throw new Error('Access token and refresh token are required for API binding save.');
      }
      const payload = {
        tenantId,
        service,
        provider,
        accessToken,
        refreshToken,
        accountId: provider === 'openai-codex' ? accountId : undefined,
        googleEmail: provider === 'google-antigravity' ? googleEmail : undefined,
        googleProjectId: provider === 'google-antigravity' ? googleProjectId : undefined,
        primaryModel,
        fallbackModels,
      };
      const res = await fetch('/api/admin/openclaw/oauth/bindings', {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `Failed to save binding (${res.status})`);
      }
      setApiMessage('Binding saved with encrypted secret storage.');
      await loadBindings();
    } catch (err) {
      setApiMessage((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function executeBinding() {
    setExecuting(true);
    setApiMessage(null);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(
        `/api/admin/openclaw/oauth/execute/${tenantId}/${service}/${provider}`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ waitForSuccess: true, timeoutSeconds: 900 }),
        }
      );
      const text = await res.text();
      if (!res.ok) throw new Error(text || `Execution failed (${res.status})`);
      setApiMessage(`Execution result: ${text}`);
      await loadBindings();
    } catch (err) {
      setApiMessage((err as Error).message);
    } finally {
      setExecuting(false);
    }
  }

  return (
    <section className="rounded-2xl border border-emerald-500/20 bg-slate-900/60 p-6 space-y-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-emerald-300">OAuth Account Rotation</h2>
          <p className="text-sm text-slate-400">
            Generate repeatable commands/config for swapping OAuth account bindings per OpenClaw
            instance.
          </p>
        </div>
      </div>

      <div className="rounded-lg border border-white/15 bg-black/30 p-3 space-y-3">
        <h3 className="text-sm font-semibold text-slate-200">
          Secret Inputs (for encrypted binding save)
        </h3>
        <label className="text-sm text-slate-300 block">
          Access Token
          <input
            type="password"
            value={accessToken}
            onChange={(e) => setAccessToken(e.target.value)}
            className="mt-1 w-full rounded-lg bg-slate-950 border border-white/15 px-3 py-2 text-sm text-slate-100"
          />
        </label>
        <label className="text-sm text-slate-300 block">
          Refresh Token
          <input
            type="password"
            value={refreshToken}
            onChange={(e) => setRefreshToken(e.target.value)}
            className="mt-1 w-full rounded-lg bg-slate-950 border border-white/15 px-3 py-2 text-sm text-slate-100"
          />
        </label>
        {provider === 'openai-codex' && (
          <label className="text-sm text-slate-300 block">
            Account ID
            <input
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              className="mt-1 w-full rounded-lg bg-slate-950 border border-white/15 px-3 py-2 text-sm text-slate-100"
            />
          </label>
        )}
        {provider === 'google-antigravity' && (
          <>
            <label className="text-sm text-slate-300 block">
              Google Email
              <input
                value={googleEmail}
                onChange={(e) => setGoogleEmail(e.target.value)}
                className="mt-1 w-full rounded-lg bg-slate-950 border border-white/15 px-3 py-2 text-sm text-slate-100"
              />
            </label>
            <label className="text-sm text-slate-300 block">
              Google Project ID
              <input
                value={googleProjectId}
                onChange={(e) => setGoogleProjectId(e.target.value)}
                className="mt-1 w-full rounded-lg bg-slate-950 border border-white/15 px-3 py-2 text-sm text-slate-100"
              />
            </label>
          </>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <label className="text-sm text-slate-300">
          Tenant ID
          <input
            value={tenantId}
            onChange={(e) => setTenantId(e.target.value)}
            className="mt-1 w-full rounded-lg bg-slate-950 border border-white/15 px-3 py-2 text-sm text-slate-100"
          />
        </label>
        <label className="text-sm text-slate-300">
          Service
          <input
            value={service}
            onChange={(e) => setService(e.target.value)}
            className="mt-1 w-full rounded-lg bg-slate-950 border border-white/15 px-3 py-2 text-sm text-slate-100"
          />
        </label>
        <label className="text-sm text-slate-300">
          Provider
          <select
            value={provider}
            onChange={(e) => applyProviderDefaults(e.target.value as ProviderKey)}
            className="mt-1 w-full rounded-lg bg-slate-950 border border-white/15 px-3 py-2 text-sm text-slate-100"
          >
            <option value="openai-codex">openai-codex</option>
            <option value="anthropic">anthropic</option>
            <option value="google-antigravity">google-antigravity</option>
            <option value="kilo">kilo</option>
          </select>
        </label>
        <label className="text-sm text-slate-300 md:col-span-2">
          Auth File
          <input
            value={authFile}
            onChange={(e) => setAuthFile(e.target.value)}
            className="mt-1 w-full rounded-lg bg-slate-950 border border-white/15 px-3 py-2 text-sm text-slate-100"
          />
        </label>
        <label className="text-sm text-slate-300">
          Primary Model
          <input
            value={primaryModel}
            onChange={(e) => setPrimaryModel(e.target.value)}
            className="mt-1 w-full rounded-lg bg-slate-950 border border-white/15 px-3 py-2 text-sm text-slate-100"
          />
        </label>
        <label className="text-sm text-slate-300">
          Fallback Models (CSV)
          <input
            value={fallbackModels}
            onChange={(e) => setFallbackModels(e.target.value)}
            className="mt-1 w-full rounded-lg bg-slate-950 border border-white/15 px-3 py-2 text-sm text-slate-100"
          />
        </label>
        <label className="text-sm text-slate-300">
          Access Path (JQ)
          <input
            value={accessPath}
            onChange={(e) => setAccessPath(e.target.value)}
            className="mt-1 w-full rounded-lg bg-slate-950 border border-white/15 px-3 py-2 text-sm text-slate-100"
          />
        </label>
        <label className="text-sm text-slate-300">
          Refresh Path (JQ)
          <input
            value={refreshPath}
            onChange={(e) => setRefreshPath(e.target.value)}
            className="mt-1 w-full rounded-lg bg-slate-950 border border-white/15 px-3 py-2 text-sm text-slate-100"
          />
        </label>
        <label className="text-sm text-slate-300 md:col-span-2">
          Account Path (JQ)
          <input
            value={accountPath}
            onChange={(e) => setAccountPath(e.target.value)}
            className="mt-1 w-full rounded-lg bg-slate-950 border border-white/15 px-3 py-2 text-sm text-slate-100"
          />
        </label>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          onClick={loadBindings}
          className="rounded-md border border-white/20 px-3 py-2 text-xs text-slate-100 hover:bg-white/10"
        >
          Load Stored Bindings
        </button>
        <button
          onClick={saveBinding}
          disabled={saving}
          className="rounded-md border border-emerald-400/30 px-3 py-2 text-xs text-emerald-200 hover:bg-emerald-400/10 disabled:opacity-60"
        >
          {saving ? 'Saving...' : 'Save Binding (API)'}
        </button>
        <button
          onClick={executeBinding}
          disabled={executing}
          className="rounded-md border border-cyan-400/30 px-3 py-2 text-xs text-cyan-200 hover:bg-cyan-400/10 disabled:opacity-60"
        >
          {executing ? 'Executing...' : 'Execute Rotation (API)'}
        </button>
      </div>

      {apiMessage && (
        <div className="rounded-lg border border-amber-400/30 bg-amber-500/10 p-3 text-xs text-amber-200 whitespace-pre-wrap">
          {apiMessage}
        </div>
      )}

      {bindings.length > 0 && (
        <div className="rounded-lg border border-white/15 bg-black/30 p-3">
          <h3 className="text-sm font-semibold text-slate-200 mb-2">Stored Bindings</h3>
          <div className="space-y-1 text-xs text-slate-300">
            {bindings.map((binding) => (
              <div key={binding.key} className="rounded border border-white/10 px-2 py-1">
                {binding.tenantId} | {binding.service} | {binding.provider} | updated{' '}
                {new Date(binding.updatedAt).toLocaleString()}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="rounded-lg border border-white/15 bg-black/30 p-3 space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-200">One-shot command</h3>
          <button
            onClick={() => copy(oneShotCommand)}
            className="rounded-md border border-emerald-400/30 px-2 py-1 text-xs text-emerald-200 hover:bg-emerald-400/10"
          >
            Copy
          </button>
        </div>
        <pre className="text-xs text-emerald-200 whitespace-pre-wrap break-all">
          {oneShotCommand}
        </pre>
      </div>

      <div className="rounded-lg border border-white/15 bg-black/30 p-3 space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-200">Config snippet</h3>
          <button
            onClick={() => copy(configSnippet)}
            className="rounded-md border border-cyan-400/30 px-2 py-1 text-xs text-cyan-200 hover:bg-cyan-400/10"
          >
            Copy
          </button>
        </div>
        <pre className="text-xs text-cyan-100 whitespace-pre-wrap">{configSnippet}</pre>
      </div>

      <div className="rounded-lg border border-white/15 bg-black/30 p-3 space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-200">Verification command</h3>
          <button
            onClick={() => copy(verifyCommand)}
            className="rounded-md border border-violet-400/30 px-2 py-1 text-xs text-violet-200 hover:bg-violet-400/10"
          >
            Copy
          </button>
        </div>
        <pre className="text-xs text-violet-100 whitespace-pre-wrap break-all">{verifyCommand}</pre>
      </div>
    </section>
  );
}
