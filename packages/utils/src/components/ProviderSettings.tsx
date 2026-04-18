"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProviderSettings = void 0;
// Import React properly
import * as React from 'react';
import { jsx as _jsx, jsxs as _jsxs } from 'react/jsx-runtime';
import { FormControl, InputLabel, MenuItem, Select, TextField } from '@mui/material';
import { Settings as SettingsIcon } from '@mui/icons-material';
// import { providerRegistry } from '../providers/registry.js';
import type { ChangeEvent } from 'react';

export interface ProviderSettings {
    apiKey: string;
}

interface ProviderSettingsProps {
    onProviderChange: (provider: string, model: string) => void;
}

const ProviderSettings: React.FC<ProviderSettingsProps> = ({ onProviderChange }) => {
    // Use React hooks with proper import
    const [selectedProvider, setSelectedProvider] = React.useState('');
    const [selectedModel, setSelectedModel] = React.useState('');
    const [apiKey, setApiKey] = React.useState('');
    // Using the error state but ignoring the setter for now
    const [error] = React.useState<string | null>(null);

    const handleProviderChange = (event: ChangeEvent<HTMLSelectElement>) => {
        const newProvider = event.target.value;
        setSelectedProvider(newProvider);
        onProviderChange(newProvider, '');
    };

    const handleModelChange = (event: ChangeEvent<HTMLSelectElement>) => {
        const newModel = event.target.value;
        setSelectedModel(newModel);
        onProviderChange(selectedProvider, newModel);
    };

    return _jsxs(FormControl, {
        fullWidth: true,
        children: [
            _jsx(InputLabel, { id: "provider-select-label", children: "Provider" }),
            _jsx(Select, {
                labelId: "provider-select-label",
                value: selectedProvider,
                onChange: handleProviderChange,
                // Mock providers since getProviders doesn't exist
                children: [{ id: 'openai', name: 'OpenAI', type: 'provider' }].map((provider) => (
                    _jsxs(MenuItem, { value: provider.id, children: [
                        provider.name,
                        provider.type === 'aggregator' && (
                            _jsx(SettingsIcon, {
                                sx: { ml: 1, fontSize: '0.8em', opacity: 0.7 }
                            })
                        )
                    ]}, provider.id)
                ))
            }),
            selectedProvider && _jsx(Select, {
                labelId: "model-select-label",
                value: selectedModel,
                onChange: handleModelChange,
                // Mock models since getProvider doesn't exist
                children: { models: ['gpt-3.5-turbo', 'gpt-4'] }
                    ?.models.map((modelName: string) => (
                        _jsx(MenuItem, { value: modelName, children: modelName }, modelName)
                    ))
            }),
            _jsx(TextField, {
                label: "API Key",
                type: "password",
                value: apiKey,
                onChange: (e: ChangeEvent<HTMLInputElement>) => setApiKey(e.target.value),
                fullWidth: true
            }),
            error && _jsx("div", { style: { color: 'red' }, children: error })
        ]
    });
};

export default ProviderSettings;
