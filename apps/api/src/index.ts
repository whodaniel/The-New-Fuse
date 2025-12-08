import { PrismaService } from '@the-new-fuse/database';
import cors from 'cors';
import express from 'express';
import { LLMProviderService, LLMRegistry } from './llm/llm-provider.service';
import { agentRouter } from './routes/agents';
import { authRoutes } from './routes/authRoutes';
import chatRoutes from './routes/chatRoutes'; // Added chatRoutes import
import featureRoutes from './routes/featureRoutes'; // Added featureRoutes import
import mcpRoutes from './routes/mcpRoutes'; // Added mcpRoutes import
import onboardingRoutes from './routes/onboardingRoutes';
import systemRoutes from './routes/systemRoutes'; // Added systemRoutes import
import userRoutes from './routes/userRoutes'; // Added userRoutes import

const app = express();
const port = process.env.PORT || 3003;

// Middleware
app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  })
);
app.use(express.json());

// Initialize services
const mockLLMRegistry: LLMRegistry = {
  async registerProvider(id: string, config: any): Promise<void> {
    // Mock implementation
  },
  async unregisterProvider(id: string): Promise<void> {
    // Mock implementation
  },
};

const mockPrismaService = new PrismaService();
const llmService = new LLMProviderService(mockLLMRegistry, mockPrismaService);

// Routes
app.use('/api/agents', agentRouter);
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes); // Added userRoutes
app.use('/api/chat', chatRoutes); // Added chatRoutes
app.use('/api/system', systemRoutes); // Added systemRoutes
app.use('/api/features', featureRoutes); // Added featureRoutes
app.use('/api/mcp', mcpRoutes); // Added mcpRoutes
app.use(onboardingRoutes); // Register onboarding routes

// LLM Provider routes
app.get('/api/llm/providers', async (req, res) => {
  try {
    const providers = await llmService.findAll();
    res.json(providers);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

app.post('/api/llm/providers/register-claude-code-cli', async (req, res) => {
  try {
    const provider = await llmService.registerClaudeCodeCLI();
    if (!provider) {
      res.json({
        success: false,
        message:
          'Claude Code CLI is not available on this system. Please ensure it is installed and accessible.',
      });
    } else {
      res.json({
        success: true,
        provider,
        message: 'Claude Code CLI has been successfully registered as a local LLM provider',
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: `Failed to register Claude Code CLI: ${(error as Error).message}`,
    });
  }
});

app.post('/api/llm/providers/register-gemini-cli', async (req, res) => {
  try {
    const provider = await llmService.registerGeminiCLI();
    if (!provider) {
      res.json({
        success: false,
        message:
          'Gemini CLI is not available on this system. Please ensure it is installed and accessible.',
      });
    } else {
      res.json({
        success: true,
        provider,
        message: 'Gemini CLI has been successfully registered as a local LLM provider',
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: `Failed to register Gemini CLI: ${(error as Error).message}`,
    });
  }
});

// Root route
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to The New Fuse API Server', status: 'online' });
});

// Health check route
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: err.message || 'Internal server error',
  });
});

app.listen(port, () => {
  console.log(`API server running on port ${port}`);
});
