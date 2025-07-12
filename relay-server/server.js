import express from 'express';
import { createClient } from 'redis';

const app = express();
const port = 3000;

const redisClient = createClient();

redisClient.on('error', err => console.log('Redis Client Error', err));

async function connectRedis() {
  if (!redisClient.isOpen) {
    await redisClient.connect();
  }
}

app.get('/', async (req, res) => {
  let redisStatus = 'disconnected';
  try {
    await connectRedis();
    redisStatus = redisClient.isOpen ? 'connected' : 'disconnected';
  } catch (error) {
    console.error('Redis connection check failed:', error);
    redisStatus = 'error';
  }
  res.json({ status: 'Relay Server is running!', redis: redisStatus, timestamp: new Date() });
});

app.get('/health', async (req, res) => {
  let redisStatus = 'disconnected';
  try {
    await connectRedis();
    redisStatus = redisClient.isOpen ? 'connected' : 'disconnected';
  } catch (error) {
    console.error('Redis health check failed:', error);
    redisStatus = 'error';
  }
  res.json({ status: 'ok', redis: redisStatus, timestamp: new Date() });
});

app.listen(port, () => {
  console.log(`Relay Server running on port ${port} | PID: ${process.pid}`);
  connectRedis().catch(console.error);
});