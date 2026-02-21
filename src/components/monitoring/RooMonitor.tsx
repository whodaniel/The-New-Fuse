import React, { FC, useState, useEffect, useRef } from 'react';
import { RedisService } from '@the-new-fuse/../../packages/database/src/redis.service.ts';

interface Message {
  id: string;
  sender: 'rooCoder';
  content: string;
  timestamp: Date;
  analyzed?: boolean;
  type?: string;
}

interface MonitorStats {
  totalMessages: number;
  codeSnippets: number;
  textResponses: number;
  errorMessages: number;
  averageResponseTime?: number;
  lastActivity: Date | null;
}

const RooMonitor: FC = (): JSX.Element => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [channelName, setChannelName] = useState<string>('roo-coder-channel');
  const [stats, setStats] = useState<MonitorStats>({
    totalMessages: 0,
    codeSnippets: 0,
    textResponses: 0,
    errorMessages: 0,
    lastActivity: null
  });
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordedSession, setRecordedSession] = useState<Message[]>([]);
  
  const redisServiceRef = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize Redis service
  useEffect(() => {
    const initRedis = async () => {
      try {
        const redisService = new RedisService();
        await redisService.connect();
        redisServiceRef.current = redisService;
      } catch (error) {
        console.error('Failed to initialize Redis service', error);
      }
    };

    initRedis();

    return () => {
      if (redisServiceRef.current) {
        redisServiceRef.current.disconnect();
      }
    };
  }, []);

  // Connect to Roo Coder channel
  const connectToRooMonitor = async (): Promise<void> => {
    if (!redisServiceRef.current || !channelName) return;

    try {
      await redisServiceRef.current.setupRooCoder(channelName);
      
      // Listen for messages from Roo Coder
      redisServiceRef.current.onRooCoderMessage((message: any) => {
        const newMessage: Message = {
          id: Date.now().toString(),
          sender: 'rooCoder',
          content: typeof message === 'string' ? message : JSON.stringify(message),
          timestamp: new Date()
        };
        
        // Analyze the message content
        const analyzedMessage = analyzeMessage(newMessage);
        
        setMessages(prev => [...prev, analyzedMessage]);
        
        // Update stats
        updateStats(analyzedMessage);
        
        // Add to recording if active
        if (isRecording) {
          setRecordedSession(prev => [...prev, analyzedMessage]);
        }
      });

      setIsConnected(true);
      
      const systemMessage: Message = {
        id: Date.now().toString(),
        sender: 'rooCoder',
        content: `Monitoring Roo Coder on channel: ${channelName}`,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, systemMessage]);
    } catch (error) {
      console.error('Failed to connect to Roo Coder for monitoring:', error);
    }
  };

  // Analyze message to determine its type
  const analyzeMessage = (message: Message): Message => {
    const content = message.content;
    const analyzedMessage = { ...message, analyzed: true };
    
    // Check if it contains code snippets (simple heuristic)
    if (content.includes('```') || content.includes('function ') || 
        content.includes('class ') || content.includes('import ') || 
        content.includes('const ') || content.includes('let ') || 
        content.includes('var ')) {
      analyzedMessage.type = 'code';
    } 
    // Check if it might be an error message
    else if (content.toLowerCase().includes('error') || 
             content.toLowerCase().includes('exception') || 
             content.toLowerCase().includes('failed')) {
      analyzedMessage.type = 'error';
    } 
    // Otherwise it's probably just text
    else {
      analyzedMessage.type = 'text';
    }
    
    return analyzedMessage;
  };

  // Update monitoring statistics
  const updateStats = (message: Message): void => {
    setStats(prevStats => {
      const newStats = { ...prevStats };
      newStats.totalMessages += 1;
      newStats.lastActivity = new Date();
      
      if (message.type === 'code') {
        newStats.codeSnippets += 1;
      } else if (message.type === 'error') {
        newStats.errorMessages += 1;
      } else if (message.type === 'text') {
        newStats.textResponses += 1;
      }
      
      return newStats;
    });
  };

  // Toggle recording session
  const toggleRecording = (): void => {
    if (!isRecording) {
      // Start new recording
      setRecordedSession([]);
      setIsRecording(true);
    } else {
      // Stop recording
      setIsRecording(false);
      // Here you could save the recording or do something with it
      
    }
  };

  // Export recorded session
  const exportSession = (): void => {
    if (recordedSession.length === 0) return;
    
    const sessionData = JSON.stringify(recordedSession, null, 2);
    const blob = new Blob([sessionData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `roo-session-${new Date().toISOString()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="flex flex-col h-full bg-gray-100 rounded-lg shadow-lg">
      <div className="p-4 bg-blue-600 text-white rounded-t-lg">
        <h2 className="text-xl font-bold">Roo Coder Monitor</h2>
        <div className="flex items-center mt-2">
          <input
            type="text"
            value={channelName}
            onChange={(e) => setChannelName(e.target.value)}
            placeholder="Channel name"
            className="px-3 py-1 mr-2 text-black rounded"
            disabled={isConnected}
          />
          <button
            onClick={connectToRooMonitor}
            disabled={isConnected}
            className={`px-4 py-1 rounded ${isConnected ? 'bg-gray-400' : 'bg-green-500 hover:bg-green-600'}`}
          >
            {isConnected ? 'Monitoring' : 'Start Monitoring'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 p-4 bg-gray-200">
        <div className="bg-white p-3 rounded shadow">
          <h3 className="font-bold">Total Messages</h3>
          <p className="text-2xl">{stats.totalMessages}</p>
        </div>
        <div className="bg-white p-3 rounded shadow">
          <h3 className="font-bold">Code Snippets</h3>
          <p className="text-2xl">{stats.codeSnippets}</p>
        </div>
        <div className="bg-white p-3 rounded shadow">
          <h3 className="font-bold">Error Messages</h3>
          <p className="text-2xl text-red-500">{stats.errorMessages}</p>
        </div>
      </div>

      <div className="flex-1 p-4 overflow-y-auto">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-500">
            No messages yet. Connect to Roo Coder and start monitoring!
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`mb-4 p-3 rounded-lg max-w-3/4 mr-auto ${msg.type === 'error' ? 'bg-red-100' : msg.type === 'code' ? 'bg-gray-200' : 'bg-gray-300'}`}
            >
              <div className="font-bold flex justify-between">
                <span>Roo Coder</span>
                <span className="text-xs opacity-75">{msg.type}</span>
              </div>
              <div className="whitespace-pre-wrap">{msg.content}</div>
              <div className="text-xs opacity-75 mt-1">
                {msg.timestamp.toLocaleTimeString()}
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 bg-gray-200 border-t border-gray-300 flex justify-between">
        <div>
          <button
            onClick={toggleRecording}
            className={`px-4 py-1 rounded mr-2 ${isRecording ? 'bg-red-500 hover:bg-red-600' : 'bg-blue-500 hover:bg-blue-600'} text-white`}
          >
            {isRecording ? 'Stop Recording' : 'Start Recording'}
          </button>
          <button
            onClick={exportSession}
            disabled={recordedSession.length === 0}
            className={`px-4 py-1 rounded ${recordedSession.length === 0 ? 'bg-gray-400' : 'bg-green-500 hover:bg-green-600'} text-white`}
          >
            Export Session
          </button>
        </div>
        <div className="text-sm">
          {stats.lastActivity && (
            <span>Last activity: {stats.lastActivity.toLocaleTimeString()}</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default RooMonitor;