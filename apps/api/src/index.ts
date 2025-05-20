import express from 'express';
import cors from 'cors';
import { agentRouter } from './routes/agents.js';
import { authRoutes } from './routes/authRoutes.js';
import onboardingRoutes from './routes/onboardingRoutes.js';
import userRoutes from './routes/userRoutes.js'; // Added userRoutes import

const app = express();
const port = process.env.PORT || 3003;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json());

// Routes
app.use('/api/agents', agentRouter);
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes); // Added userRoutes
app.use(onboardingRoutes); // Register onboarding routes

// Root route
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to The New Fuse API Server', status: 'online' });
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: err.message || 'Internal server error'
  });
});

app.listen(port, () => {
  console.log(`API server running on port ${port}`);
});
