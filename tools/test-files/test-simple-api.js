#!/usr/bin/env node

/**
 * Simple API server to test Claude Code CLI integration
 */

const express = require('express');
const cors = require('cors');
const { spawn } = require('child_process');

const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json());

// Mock LLM providers data
const providers = [
  {
    id: '1',
    name: 'OpenAI GPT-4',
    provider: 'openai',
    modelName: 'gpt-4',
    isDefault: true
  },
  {
    id: '2', 
    name: 'Claude Code CLI (Local)',
    provider: 'local',
    modelName: 'claude-3-sonnet',
    apiEndpoint: 'local://claude-code-cli',
    isDefault: false
  },
  {
    id: '3',
    name: 'Gemini CLI (Local)',
    provider: 'local',
    modelName: 'gemini-pro',
    apiEndpoint: 'local://gemini-cli',
    isDefault: false
  }
];

// Routes
app.get('/', (req, res) => {
  res.json({ 
    message: 'The New Fuse API Server (Test Mode)', 
    status: 'online',
    timestamp: new Date().toISOString()
  });
});

app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

app.get('/api/llm/providers', (req, res) => {
  res.json(providers);
});

app.post('/api/llm/providers/register-claude-code-cli', async (req, res) => {
  try {
    // Check if Claude Code CLI is available
    const checkProcess = spawn('which', ['claude'], { stdio: 'pipe', shell: true });
    
    checkProcess.on('exit', (code) => {
      if (code === 0) {
        // Add Claude Code CLI to providers if not already there
        const existingProvider = providers.find(p => p.provider === 'local' && p.modelName === 'claude-3-sonnet');
        
        if (!existingProvider) {
          const newProvider = {
            id: String(providers.length + 1),
            name: 'Claude Code CLI (Local)',
            provider: 'local',
            modelName: 'claude-3-sonnet',
            apiEndpoint: 'local://claude-code-cli',
            isDefault: false
          };
          providers.push(newProvider);
        }
        
        res.json({
          success: true,
          provider: existingProvider || providers[providers.length - 1],
          message: 'Claude Code CLI has been successfully registered as a local LLM provider'
        });
      } else {
        res.json({
          success: false,
          message: 'Claude Code CLI is not available on this system. Please ensure it is installed and accessible.'
        });
      }
    });
    
    checkProcess.on('error', () => {
      res.status(500).json({
        success: false,
        message: 'Error checking Claude Code CLI availability'
      });
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: `Failed to register Claude Code CLI: ${error.message}`
    });
  }
});

app.post('/api/llm/providers/register-gemini-cli', async (req, res) => {
  try {
    // Check if Gemini CLI is available
    const checkProcess = spawn('which', ['gemini'], { stdio: 'pipe', shell: true });
    
    checkProcess.on('exit', (code) => {
      if (code === 0) {
        // Add Gemini CLI to providers if not already there
        const existingProvider = providers.find(p => p.provider === 'local' && p.modelName === 'gemini-pro');
        
        if (!existingProvider) {
          const newProvider = {
            id: String(providers.length + 1),
            name: 'Gemini CLI (Local)',
            provider: 'local',
            modelName: 'gemini-pro',
            apiEndpoint: 'local://gemini-cli',
            isDefault: false
          };
          providers.push(newProvider);
        }
        
        res.json({
          success: true,
          provider: existingProvider || providers[providers.length - 1],
          message: 'Gemini CLI has been successfully registered as a local LLM provider'
        });
      } else {
        res.json({
          success: false,
          message: 'Gemini CLI is not available on this system. Please ensure it is installed and accessible.'
        });
      }
    });
    
    checkProcess.on('error', () => {
      res.status(500).json({
        success: false,
        message: 'Error checking Gemini CLI availability'
      });
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: `Failed to register Gemini CLI: ${error.message}`
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: err.message || 'Internal server error'
  });
});

app.listen(port, () => {
  console.log(`🚀 Test API server running on port ${port}`);
  console.log(`📍 Health check: http://localhost:${port}/health`);
  console.log(`🤖 LLM providers: http://localhost:${port}/api/llm/providers`);
});