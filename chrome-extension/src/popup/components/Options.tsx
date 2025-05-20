import React from 'react';
import { Box, Container, Typography, TextField, Switch, FormControlLabel } from '@mui/material';
import { ThemeProvider } from '@mui/material/styles';
import { lightTheme, darkTheme } from '../../styles/theme.js';
import { useStore } from '@utils/store';

const Options: React.FC = () => {
  const { isDarkMode, setDarkMode } = useStore();
  const [wsUrl, setWsUrl] = React.useState('');

  React.useEffect(() => {
    // Load saved WebSocket URL
    chrome.storage.local.get(['websocketUrl'], (result) => {
      if (result.websocketUrl) {
        setWsUrl(result.websocketUrl);
      }
    });
  }, []);

  const handleWsUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value;
    setWsUrl(url);
    chrome.storage.local.set({ websocketUrl: url });
  };

  return (
    <ThemeProvider theme={isDarkMode ? darkTheme : lightTheme}>
      <Container maxWidth="sm">
        <Box sx={{ mt: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            The New Fuse Settings
          </Typography>
          
          <Box sx={{ my: 4 }}>
            <TextField
              fullWidth
              label="WebSocket Server URL"
              value={wsUrl}
              onChange={handleWsUrlChange}
              margin="normal"
              helperText="The WebSocket server URL for communication"
            />
          </Box>

          <Box sx={{ my: 4 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={isDarkMode}
                  onChange={(e) => setDarkMode(e.target.checked)}
                />
              }
              label="Dark Mode"
            />
          </Box>
        </Box>
      </Container>
    </ThemeProvider>
  );
};

export default Options;
