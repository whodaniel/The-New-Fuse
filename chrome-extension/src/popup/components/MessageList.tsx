import React from 'react';
import { Box, Paper, Typography } from '@mui/material';
import { useStore } from '@utils/store';

const MessageList: React.FC = () => {
  const messages = useStore((state) => state.messages);
  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  React.useEffect(() => {
    scrollToBottom();
  }, [messages]);

  return (
    <Box sx={{ p: 2, height: '100%', overflowY: 'auto' }}>
      {messages.map((message) => (
        <Paper
          key={message.id}
          elevation={1}
          sx={{
            p: 2,
            mb: 2,
            maxWidth: '80%',
            ml: message.type === 'received' ? 0 : 'auto',
            mr: message.type === 'sent' ? 0 : 'auto',
            bgcolor: message.type === 'sent' ? 'primary.light' : 'background.paper',
          }}
        >
          <Typography variant="body1">{message.text}</Typography>
          <Typography variant="caption" sx={{ display: 'block', mt: 1, opacity: 0.7 }}>
            {new Date(message.timestamp).toLocaleTimeString()}
          </Typography>
        </Paper>
      ))}
      <div ref={messagesEndRef} />
    </Box>
  );
};

export default MessageList;
