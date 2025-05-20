import express from 'express';
import path from 'path';
import cors from 'cors';
import dotenv from 'dotenv';
import { authRouter } from './routes/auth.js';
// Import other routes as needed

dotenv.config();

const app = express();

// Middleware
app.use(express.json());
app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true
}));

// API routes
app.use('/api/auth', authRouter);
// Add other API routes here

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  // Serve frontend static files
  app.use(express.static(path.join(__dirname, '../public')));

  // Handle React routing, return all requests to React app
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
  });
}

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  
});
