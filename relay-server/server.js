import express from 'express';
const app = express();
const port = 3000;

app.get('/', async (req, res) => {
  try {
    res.json({ status: 'Relay Server is running!', timestamp: new Date() });
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.listen(port, () => {
  console.log(`Relay Server running on port ${port} | PID: ${process.pid}`);
});