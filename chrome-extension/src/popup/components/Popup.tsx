import React, { useState } from 'react';
import './Popup.css';
import { ThemeProvider } from '@mui/material/styles';
import { Box, CssBaseline, Paper, Tabs, Tab } from '@mui/material';
import { darkTheme, lightTheme } from '../../styles/theme';
import { useStore } from '@utils/store';
import Header from './Header';
// Import components for new tabs (placeholders for now)
import CommunicationTab from './CommunicationTab';
import WebIntegrationTab from './WebIntegrationTab';
import LogsTab from './LogsTab';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      className="tab-panel-base"
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `simple-tab-${index}`,
    'aria-controls': `simple-tabpanel-${index}`,
  };
}

const Popup: React.FC = () => {
  const isDarkMode = useStore((state) => state.isDarkMode);
  const [value, setValue] = useState(0); // State for active tab

  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };

  return (
    <ThemeProvider theme={isDarkMode ? darkTheme : lightTheme}>
      <CssBaseline />
      <Paper
        sx={{
          width: { xs: '100vw', sm: '400px' },
          height: { xs: '100vh', sm: '600px' },
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          boxShadow: 3,
          borderRadius: 2,
        }}
      >
        <Header />
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs 
            value={value} 
            onChange={handleChange} 
            aria-label="basic tabs example"
            variant="scrollable"
            scrollButtons="auto"
            sx={{ 
              minHeight: '48px',
              '& .MuiTab-root': {
                textTransform: 'none',
                fontSize: '14px',
                minWidth: '120px',
              }
            }}
          >
            <Tab label="Communication" {...a11yProps(0)} />
            <Tab label="Web Integration" {...a11yProps(1)} />
            <Tab label="Logs" {...a11yProps(2)} />
          </Tabs>
        </Box>
        <TabPanel value={value} index={0} className="tab-panel-content">
          <CommunicationTab />
        </TabPanel>
        <TabPanel value={value} index={1} className="tab-panel-content">
          <WebIntegrationTab />
        </TabPanel>
        <TabPanel value={value} index={2} className="tab-panel-content">
          <LogsTab />
        </TabPanel>
      </Paper>
    </ThemeProvider>
  );
};

export default Popup;
