import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
import { Box, Container, Typography, TextField, Switch, FormControlLabel } from '@mui/material';
import { ThemeProvider } from '@mui/material/styles';
import { lightTheme, darkTheme } from '../../styles/theme.js';
import { useStore } from '@utils/store';
const Options = () => {
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
    const handleWsUrlChange = (e) => {
        const url = e.target.value;
        setWsUrl(url);
        chrome.storage.local.set({ websocketUrl: url });
    };
    return (_jsx(ThemeProvider, { theme: isDarkMode ? darkTheme : lightTheme, children: _jsx(Container, { maxWidth: "sm", children: _jsxs(Box, { sx: { mt: 4 }, children: [_jsx(Typography, { variant: "h4", component: "h1", gutterBottom: true, children: "The New Fuse Settings" }), _jsx(Box, { sx: { my: 4 }, children: _jsx(TextField, { fullWidth: true, label: "WebSocket Server URL", value: wsUrl, onChange: handleWsUrlChange, margin: "normal", helperText: "The WebSocket server URL for communication" }) }), _jsx(Box, { sx: { my: 4 }, children: _jsx(FormControlLabel, { control: _jsx(Switch, { checked: isDarkMode, onChange: (e) => setDarkMode(e.target.checked) }), label: "Dark Mode" }) })] }) }) }));
};
export default Options;
//# sourceMappingURL=Options.js.map