import React, { useState } from 'react';
import { Card, CardContent, Typography, Box, FormControl, InputLabel, Select, MenuItem, Tooltip, IconButton } from '@mui/material';
import { Info } from '@mui/icons-material';
import { providerRegistry } from '../registry.js';

const ProviderSettings = () => {
  const [selectedProvider, setSelectedProvider] = useState('');
  const [model, setModel] = useState('');

  const providers = providerRegistry.getProviders();

  const handleProviderChange = (event) => {
    setSelectedProvider(event.target.value);
  };

  const handleModelChange = (event) => {
    setModel(event.target.value);
  };

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          LLM Provider Settings
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <FormControl fullWidth>
            <InputLabel>Provider</InputLabel>
            <Select value={selectedProvider} label="Provider" onChange={handleProviderChange}>
              {providers.map((provider) => (
                <MenuItem key={provider.id} value={provider.id}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    {provider.name}
                    {provider.type === 'aggregator' && (
                      <Tooltip title="Aggregator: Provides access to multiple LLM providers">
                        <IconButton size="small" sx={{ ml: 1 }}>
                          <Info fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          {selectedProvider && (
            <>
              <FormControl fullWidth>
                <InputLabel>Model</InputLabel>
                <Select value={model} label="Model" onChange={handleModelChange}>
                  {providerRegistry.getModels(selectedProvider).map((model) => (
                    <MenuItem key={model.id} value={model.id}>
                      {model.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

export default ProviderSettings;
