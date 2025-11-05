import express from 'express';
import * as cors from 'cors';
import { agentRouter } from './routes/agents/index.js';
import { authRoutes } from './routes/authRoutes.js';
import onboardingRoutes from './routes/onboardingRoutes.js';
import userRoutes from './routes/userRoutes.js'; // Added userRoutes import
import { LLMProviderService } from './llm/llm-provider.service.js';
import { PrismaService } from '@the-new-fuse/database';
import { Logger } from '@nestjs/common';
import { ModularController } from './controllers/modular.controller.js';
const app = express();
const port = process.env.PORT || 3003;
// Middleware
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
}));
app.use(express.json());
// Initialize services
const mockLLMRegistry = {
    async registerProvider(_id, _config) {
        // Mock implementation for local dev/testing
    },
    async unregisterProvider(_id) {
        // Mock implementation for local dev/testing
    }
};
const mockPrismaService = new PrismaService();
const llmService = new LLMProviderService(mockLLMRegistry, mockPrismaService);
// Routes
app.use('/api/agents', agentRouter);
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes); // Added userRoutes
app.use(onboardingRoutes); // Register onboarding routes

// Initialize modular controller
const modularController = new ModularController();

// Modular architecture routes
app.get('/api/modular/status', async (req, res) => {
    try {
        const result = await modularController.getStatus();
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/modular/switch', async (req, res) => {
    try {
        const result = await modularController.switchMode(req.body);
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/modular/enable', async (req, res) => {
    try {
        const result = await modularController.enableModule(req.body);
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/modular/disable', async (req, res) => {
    try {
        const result = await modularController.disableModule(req.body);
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// LLM Provider routes
app.get('/api/llm/providers', async (req, res) => {
    try {
        const providers = await llmService.findAll();
        res.json(providers);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
app.post('/api/llm/providers/register-claude-code-cli', async (req, res) => {
    try {
        const provider = await llmService.registerClaudeCodeCLI();
        if (!provider) {
            res.json({
                success: false,
                message: 'Claude Code CLI is not available on this system. Please ensure it is installed and accessible.'
            });
        }
        else {
            res.json({
                success: true,
                provider,
                message: 'Claude Code CLI has been successfully registered as a local LLM provider'
            });
        }
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: `Failed to register Claude Code CLI: ${error.message}`
        });
    }
});
app.post('/api/llm/providers/register-gemini-cli', async (req, res) => {
    try {
        const provider = await llmService.registerGeminiCLI();
        if (!provider) {
            res.json({
                success: false,
                message: 'Gemini CLI is not available on this system. Please ensure it is installed and accessible.'
            });
        }
        else {
            res.json({
                success: true,
                provider,
                message: 'Gemini CLI has been successfully registered as a local LLM provider'
            });
        }
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: `Failed to register Gemini CLI: ${error.message}`
        });
    }
});
app.post('/api/llm/providers/register-ollama', async (req, res) => {
    try {
        const provider = await llmService.registerOllama();
        if (!provider) {
            res.json({
                success: false,
                message: 'Ollama is not available on this system. Please ensure it is installed and running.'
            });
        }
        else {
            res.json({
                success: true,
                provider,
                message: 'Ollama has been successfully registered as a local LLM provider'
            });
        }
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: `Failed to register Ollama: ${error.message}`
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
        uptime: process.uptime()
    });
});
// Error handling middleware
const logger = new Logger('API');
app.use((err, req, res) => {
    logger.error(err.stack || err);
    res.status(500).json({
        success: false,
        message: err.message || 'Internal server error'
    });
});
app.listen(port, () => {
    logger.log(`API server running on port ${port}`);
});
// Attempt to auto-register local LLM providers at startup only when explicitly enabled
const AUTO_REGISTER_OLLAMA = process.env.AUTO_REGISTER_OLLAMA === 'true';
if (AUTO_REGISTER_OLLAMA) {
    (async () => {
        try {
            await llmService.registerOllama();
            logger.log('Attempted to register Ollama provider at startup');
        }
        catch (e) {
            logger.warn('Auto-registration of Ollama failed or Ollama is not available: ' + (e.message || e));
        }
    })();
}
else {
    logger.log('AUTO_REGISTER_OLLAMA not enabled; skipping Ollama auto-registration at startup.');
}
//# sourceMappingURL=index.js.map