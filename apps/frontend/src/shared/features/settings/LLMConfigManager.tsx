import { Select } from '@/components/ui';
import {
  PROVIDER_DEFAULTS,
  SUPPORTED_PROVIDERS,
  validateProviderConfig,
} from '@/services/llm/providers';
import { Button } from '@/shared/ui/core/Button';
import { Card } from '@/shared/ui/core/Card';
import { Input } from '@/shared/ui/core/Input';
import { loadCatalog, type CatalogProvider } from '@the-new-fuse/llm-catalog';
import React from 'react';

/**
 * LLM Provider Configuration panel.
 *
 * Provider dropdown — sourced from @the-new-fuse/llm-catalog so the web
 * control panel at app.thenewfuse.com shows the same free NVIDIA NIM +
 * non-NVIDIA provider list as every other TNF surface.
 *
 * Model field — sourced from the selected provider's catalog.models[].
 * When the catalog entry has no models, we fall back to the provider's
 * defaultModel so the field still has a sensible starting value.
 */
export function LLMConfigManager({ currentConfig, onConfigUpdate }) {
  const [config, setConfig] = React.useState(currentConfig);
  const [isValidating, setIsValidating] = React.useState(false);
  const [validationError, setValidationError] = React.useState(null);
  const [providers, setProviders] = React.useState<CatalogProvider[]>([]);
  const [modelOptions, setModelOptions] = React.useState<string[]>([]);

  // Load the canonical catalog once on mount.
  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const cat = await loadCatalog();
        if (!cancelled) setProviders(cat.providers);
      } catch {
        if (!cancelled) setProviders([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Resolve the catalog provider for the currently selected provider name.
  // Frontend provider names come from SUPPORTED_PROVIDERS — keep that as
  // the canonical id, but augment with additional catalog rows that the
  // user can switch to.
  const handleProviderChange = React.useCallback(
    (provider) => {
      const defaults = PROVIDER_DEFAULTS[provider];
      const catalogRow = providers.find((p) => p.id === provider);
      const newModel = catalogRow?.models?.[0] || defaults?.model || catalogRow?.defaultModel || '';
      setConfig((prev: any) =>
        Object.assign(Object.assign(Object.assign({}, prev), defaults), {
          apiKey: prev.apiKey,
          model: newModel,
        })
      );
      setModelOptions(
        catalogRow?.models && catalogRow.models.length > 0
          ? catalogRow.models
          : defaults?.model
            ? [defaults.model]
            : []
      );
    },
    [providers]
  );

  // Keep modelOptions in sync when providers finish loading.
  React.useEffect(() => {
    if (providers.length === 0) return;
    const row = providers.find((p) => p.id === config.name);
    if (row?.models && row.models.length > 0) {
      setModelOptions(row.models);
    } else if (PROVIDER_DEFAULTS[config.name]?.model) {
      setModelOptions([PROVIDER_DEFAULTS[config.name].model]);
    }
  }, [providers, config.name]);

  const handleParameterChange = React.useCallback((param, value) => {
    setConfig((prev: any) =>
      Object.assign(Object.assign({}, prev), {
        parameters: Object.assign(Object.assign({}, prev.parameters), { [param]: value }),
      })
    );
  }, []);
  const handleValidateAndSave = React.useCallback(async () => {
    setIsValidating(true);
    setValidationError(null);
    try {
      const isValid = await validateProviderConfig(config);
      if (isValid) {
        onConfigUpdate === null || onConfigUpdate === void 0 ? void 0 : onConfigUpdate(config);
      } else {
        setValidationError('Invalid configuration. Please check your settings.');
      }
    } catch (error) {
      setValidationError('Error validating configuration.');
    } finally {
      setIsValidating(false);
    }
  }, [config, onConfigUpdate]);
  return (
    <Card className="p-6 space-y-6">
      <h2 className="text-xl font-bold mb-4">LLM Provider Configuration</h2>

      <div className="space-y-6">
        <div className="space-y-2">
          <label className="font-medium">Provider</label>
          <Select value={config.name} onChange={handleProviderChange}>
            <Select.Trigger className="w-full">
              <Select.Value placeholder="Select Provider" />
            </Select.Trigger>
            <Select.Content>
              {/* Show providers the panel knows how to validate first. */}
              {Object.values(SUPPORTED_PROVIDERS).map((provider) => (
                <Select.Item key={provider} value={provider}>
                  {PROVIDER_DEFAULTS[provider].label}
                </Select.Item>
              ))}
              {/* Append additional catalog providers (NVIDIA NIM, Groq, etc.)
                  so users can route to them once they paste an API key. */}
              {providers
                .filter((p) => !Object.values(SUPPORTED_PROVIDERS).includes(p.id as any))
                .map((p) => (
                  <Select.Item key={p.id} value={p.id}>
                    {p.name || p.id} {p.models?.length ? `(${p.models.length} models)` : ''}
                  </Select.Item>
                ))}
            </Select.Content>
          </Select>
        </div>

        <div className="space-y-2">
          <label className="font-medium">API Key</label>
          <Input
            type="password"
            value={config.apiKey || ''}
            onChange={(e: any) =>
              setConfig((prev: any) =>
                Object.assign(Object.assign({}, prev), { apiKey: e.target.value })
              )
            }
            placeholder="Enter API key"
          />
        </div>

        <div className="space-y-2">
          <label className="font-medium">Model</label>
          <Select
            value={config.model}
            onChange={(value: string) =>
              setConfig((prev: any) => Object.assign(Object.assign({}, prev), { model: value }))
            }
          >
            <Select.Trigger className="w-full">
              <Select.Value placeholder={modelOptions[0] || 'Select model'} />
            </Select.Trigger>
            <Select.Content>
              {(modelOptions.length > 0 ? modelOptions : [config.model].filter(Boolean)).map(
                (m: string) => (
                  <Select.Item key={m} value={m}>
                    {m}
                  </Select.Item>
                )
              )}
            </Select.Content>
          </Select>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-medium">Parameters</h3>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="font-medium">Temperature</label>
              <Input
                type="number"
                min={0}
                max={2}
                step={0.1}
                value={config.parameters.temperature.toString()}
                onChange={(e: any) =>
                  handleParameterChange('temperature', parseFloat(e.target.value))
                }
              />
            </div>

            <div className="space-y-2">
              <label className="font-medium">Max Tokens</label>
              <Input
                type="number"
                min={1}
                value={config.parameters.maxTokens.toString()}
                onChange={(e: any) =>
                  handleParameterChange('maxTokens', parseInt(e.target.value, 10))
                }
              />
            </div>
          </div>
        </div>

        {validationError && <div className="text-red-500 text-sm">{validationError}</div>}

        <Button onClick={handleValidateAndSave} disabled={isValidating} className="w-full">
          {isValidating ? 'Validating...' : 'Save Configuration'}
        </Button>
      </div>
    </Card>
  );
}
