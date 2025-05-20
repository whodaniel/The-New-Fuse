import React, { useState } from 'react';
import { Box, TextField, IconButton } from '@mui/material';
import { Send } from '@mui/icons-material';
import { useStore } from '../../utils/store';

const InputArea: React.FC = () => {
  const [message, setMessage] = useState('');
  const addMessage = useStore((state) => state.addMessage);

  const handleSend = () => {
    if (!message.trim()) return;

    // Add message to local state
    addMessage({
      text: message,
      type: 'sent',
    });

    // Send message through WebSocket
    chrome.runtime.sendMessage({
      type: 'SEND_MESSAGE',
      data: message,
    });

    // Clear input
    setMessage('');
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  };

  return (
    <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
      <Box sx={{ display: 'flex', gap: 1 }}>
        <TextField
          fullWidth
          multiline
          maxRows={4}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Type a message..."
          size="small"
        />
        <IconButton 
          color="primary" 
          onClick={handleSend}
          disabled={!message.trim()}
        >
          <Send />
        </IconButton>
      </Box>
    </Box>
  );
};

export default InputArea;
