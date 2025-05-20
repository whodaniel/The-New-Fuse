import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper } from '@mui/material';
import { Logger } from '../../utils/logger'; // Assuming a logger utility

const logsLogger = new Logger({ name: 'LogsTab', level: 'info' });

const LogsTab: React.FC = () => {
  const [logMessages, setLogMessages] = useState<string[]>([]); // Placeholder for log messages

  // TODO: Implement actual log fetching/listening logic via background script
  useEffect(() => {
    // Simulate fetching some initial logs
    setTimeout(() => {
      setLogMessages([
        '4:02:42 PM - Connecting to ws://localhost:3712...',
        '4:02:42 PM - Connection established',
        '4:02:42 PM - Received: {"type":"SYSTEM","message":"Connected to The New Fuse WebSocket Server","timestamp":1746388962602}',
        '4:02:44 PM - Sent: {"type":"PING","timestamp":1746388964353}',
        '4:02:44 PM - Received: {"type":"PONG","timestamp":1746388964354}',
        '4:02:45 PM - Sent: {"type":"AUTH","token":"test-token"}',
        '4:03:02 PM - Received: {"type":"AUTH_RESPONSE","success":true,"timestamp":1746388982608}',
        '4:03:03 PM - Sent code message',
        '4:03:03 PM - Received: {"type":"CODE_INPUT_RECEIVED","timestamp":1746388983413}',
        '4:03:04 PM - Received: {"type":"AI_RESPONSE","result":"Processed code: Test code","timestamp":1746388984413}',
      ]);
      logsLogger.info('Simulated initial logs loaded.');
    }, 500);

    // TODO: Add listener for new log messages from background script
    // const messageListener = (message: any) => {
    //   if (message.type === 'NEW_LOG_MESSAGE' && message.payload && message.payload.log) {
    //     setLogMessages(prevLogs => [...prevLogs, message.payload.log]);
    //   }
    // };
    // chrome.runtime.onMessage.addListener(messageListener);
    // return () => {
    //   chrome.runtime.onMessage.removeListener(messageListener);
    // };
  }, []);


  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', p: 2 }}> {/* Added padding */}
      <Typography variant="h6" sx={{ mb: 1 }}>Logs</Typography>
      <Paper elevation={1} sx={{ flexGrow: 1, overflowY: 'auto', p: 1 }}>
        {logMessages.map((log, index) => (
          <Typography key={index} variant="body2" component="pre" sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', mb: 0.5 }}>
            {log}
          </Typography>
        ))}
      </Paper>
    </Box>
  );
};

export default LogsTab;
