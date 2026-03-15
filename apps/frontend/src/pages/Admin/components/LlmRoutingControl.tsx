import { useEffect, useMemo, useState } from 'react';

interface LLMRoutingSelection {
  provider: string;
  model: string;
}

interface LLMRoutingAgentConfig {
  primary: LLMRoutingSelection;
  fallback: LLMRoutingSelection;
  enabled: boolean;
}

interface LLMRoutingConfig {
  version: number;
  updatedAt: string;
  global: {
    primary: LLMRoutingSelection;
    fallback: LLMRoutingSelection;
  };
  agents: Record<string, LLMRoutingAgentConfig>;
}

interface LLMRoutingOptions {
  providers: Array<{ provider: string; models: string[] }>;
  targets: string[];
}

const defaultConfig: LLMRoutingConfig = {
  version: 1,
  updatedAt: new Date().toISOString(),
  global: {
    primary: { provider: '', model: '' },
    fallback: { provider: '', model: '' },
  },
  agents: {},
};

export function LlmRoutingControl() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [options, setOptions] = useState<LLMRoutingOptions>({ providers: [], targets: [] });
  const [config, setConfig] = useState<LLMRoutingConfig>(defaultConfig);
  const [newTarget, setNewTarget] = useState('');

  const providerOptions = useMemo(
    () => options.providers.map((entry) => entry.provider).filter(Boolean),
    [options.providers]
  );

  const modelOptionsByProvider = useMemo(() => {
    const map: Record<string, string[]> = {};
    for (const entry of options.providers) {
      map[entry.provider] = entry.models;
    }
    return map;
  }, [options.providers]);

  const knownTargets = useMemo(() => {
    const set = new Set<string>(options.targets);
    Object.keys(config.agents).forEach((target) => set.add(target));
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [config.agents, options.targets]);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      const headers = {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      };

      const [optionsRes, configRes] = await Promise.all([
        fetch('/api/admin/config/llm-routing/options', { headers }),
        fetch('/api/admin/config/llm-routing', { headers }),
      ]);

      if (!optionsRes.ok || !configRes.ok) {
        throw new Error('Failed to load LLM routing data');
      }

      const optionsJson = (await optionsRes.json()) as LLMRoutingOptions;
      const configJson = (await configRes.json()) as LLMRoutingConfig;
      setOptions(optionsJson);
      setConfig(configJson);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function save() {
    setSaving(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/admin/config/llm-routing', {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(config),
      });

      if (!res.ok) {
        throw new Error('Failed to save LLM routing configuration');
      }

      const updated = (await res.json()) as LLMRoutingConfig;
      setConfig(updated);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  function updateGlobal(kind: 'primary' | 'fallback', selection: Partial<LLMRoutingSelection>) {
    setConfig((prev) => {
      const current = prev.global[kind];
      const next = { ...current, ...selection };
      if (selection.provider) {
        const models = modelOptionsByProvider[selection.provider] || [];
        if (models.length && !models.includes(next.model)) {
          next.model = models[0];
        }
      }
      return { ...prev, global: { ...prev.global, [kind]: next } };
    });
  }

  function updateAgent(
    target: string,
    key: 'primary' | 'fallback',
    selection: Partial<LLMRoutingSelection> | { enabled: boolean }
  ) {
    setConfig((prev) => {
      const base: LLMRoutingAgentConfig = prev.agents[target] || {
        enabled: true,
        primary: { ...prev.global.primary },
        fallback: { ...prev.global.fallback },
      };

      if ('enabled' in selection) {
        return {
          ...prev,
          agents: {
            ...prev.agents,
            [target]: { ...base, enabled: selection.enabled },
          },
        };
      }

      const next = { ...base[key], ...selection };
      if (selection.provider) {
        const models = modelOptionsByProvider[selection.provider] || [];
        if (models.length && !models.includes(next.model)) {
          next.model = models[0];
        }
      }

      return {
        ...prev,
        agents: {
          ...prev.agents,
          [target]: {
            ...base,
            [key]: next,
          },
        },
      };
    });
  }

  function addTarget() {
    const target = newTarget.trim();
    if (!target) return;
    if (config.agents[target]) {
      setNewTarget('');
      return;
    }

    setConfig((prev) => ({
      ...prev,
      agents: {
        ...prev.agents,
        [target]: {
          enabled: true,
          primary: { ...prev.global.primary },
          fallback: { ...prev.global.fallback },
        },
      },
    }));
    setNewTarget('');
  }

  function removeTarget(target: string) {
    setConfig((prev) => {
      const next = { ...prev.agents };
      delete next[target];
      return { ...prev, agents: next };
    });
  }

  if (loading) {
    return (
      <div className="rounded-md border border-white/10 bg-transparent/5 p-4">
        <div className="text-sm text-slate-300">Loading centralized LLM routing...</div>
      </div>
    );
  }

  return (
    <section className="rounded-md border border-cyan-500/20 bg-slate-900/60 p-4 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-cyan-300">Centralized LLM Routing</h2>
          <p className="text-sm text-slate-400">
            Set global active/fallback providers and override per admin-side agent or service.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={load}
            className="px-3 py-2 rounded-md border border-white/15 text-slate-200 hover:bg-transparent/5 text-sm"
          >
            Reload
          </button>
          <button
            onClick={save}
            disabled={saving}
            className="px-4 py-2 rounded-md bg-cyan-500/20 border border-cyan-400/30 text-cyan-200 hover:bg-cyan-500/30 text-sm disabled:opacity-60"
          >
            {saving ? 'Saving...' : 'Save Routing'}
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-md bg-red-500/10 border border-red-500/30 p-3 text-red-300 text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <RoutingSelector
          title="Global Active"
          providers={providerOptions}
          models={modelOptionsByProvider[config.global.primary.provider] || []}
          value={config.global.primary}
          onProviderChange={(provider) => updateGlobal('primary', { provider })}
          onModelChange={(model) => updateGlobal('primary', { model })}
        />
        <RoutingSelector
          title="Global Fallback"
          providers={providerOptions}
          models={modelOptionsByProvider[config.global.fallback.provider] || []}
          value={config.global.fallback}
          onProviderChange={(provider) => updateGlobal('fallback', { provider })}
          onModelChange={(model) => updateGlobal('fallback', { model })}
        />
      </div>

      <div className="pt-2">
        <div className="text-sm text-slate-300 mb-3">Per-Service Overrides</div>
        <div className="flex flex-col md:flex-row gap-2 mb-4">
          <input
            value={newTarget}
            onChange={(e) => setNewTarget(e.target.value)}
            placeholder="Add service or agent target"
            className="flex-1 px-3 py-2 rounded-md bg-slate-950 border border-white/15 text-slate-100"
          />
          <button
            onClick={addTarget}
            className="px-3 py-2 rounded-md border border-white/15 text-slate-200 hover:bg-transparent/5"
          >
            Add Target
          </button>
        </div>

        <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1">
          {knownTargets.map((target) => {
            const entry = config.agents[target] || {
              enabled: false,
              primary: { ...config.global.primary },
              fallback: { ...config.global.fallback },
            };

            return (
              <div
                key={target}
                className="rounded-md border border-white/10 bg-slate-950/60 p-3 space-y-3"
              >
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                  <div className="text-sm font-medium text-slate-100">{target}</div>
                  <div className="flex items-center gap-2">
                    <label className="flex items-center gap-2 text-xs text-slate-300">
                      <input
                        type="checkbox"
                        checked={entry.enabled}
                        onChange={(e) =>
                          updateAgent(target, 'primary', { enabled: e.target.checked })
                        }
                      />
                      Override Enabled
                    </label>
                    <button
                      onClick={() => removeTarget(target)}
                      className="text-xs px-2 py-1 rounded border border-white/15 text-slate-300 hover:bg-transparent/5"
                    >
                      Remove
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                  <RoutingSelector
                    title="Active"
                    providers={providerOptions}
                    models={modelOptionsByProvider[entry.primary.provider] || []}
                    value={entry.primary}
                    disabled={!entry.enabled}
                    onProviderChange={(provider) => updateAgent(target, 'primary', { provider })}
                    onModelChange={(model) => updateAgent(target, 'primary', { model })}
                  />
                  <RoutingSelector
                    title="Fallback"
                    providers={providerOptions}
                    models={modelOptionsByProvider[entry.fallback.provider] || []}
                    value={entry.fallback}
                    disabled={!entry.enabled}
                    onProviderChange={(provider) => updateAgent(target, 'fallback', { provider })}
                    onModelChange={(model) => updateAgent(target, 'fallback', { model })}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function RoutingSelector({
  title,
  providers,
  models,
  value,
  disabled,
  onProviderChange,
  onModelChange,
}: {
  title: string;
  providers: string[];
  models: string[];
  value: LLMRoutingSelection;
  disabled?: boolean;
  onProviderChange: (provider: string) => void;
  onModelChange: (model: string) => void;
}) {
  return (
    <div className="rounded-md border border-white/10 bg-slate-950/40 p-3">
      <div className="text-xs uppercase tracking-widest text-slate-400 mb-2">{title}</div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        <select
          disabled={disabled}
          value={value.provider}
          onChange={(e) => onProviderChange(e.target.value)}
          className="px-2 py-2 rounded bg-slate-950 border border-white/15 text-slate-100 disabled:opacity-50"
        >
          <option value="">Select provider</option>
          {providers.map((provider) => (
            <option key={provider} value={provider}>
              {provider}
            </option>
          ))}
        </select>
        <select
          disabled={disabled}
          value={value.model}
          onChange={(e) => onModelChange(e.target.value)}
          className="px-2 py-2 rounded bg-slate-950 border border-white/15 text-slate-100 disabled:opacity-50"
        >
          <option value="">Select model</option>
          {models.map((model) => (
            <option key={model} value={model}>
              {model}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
