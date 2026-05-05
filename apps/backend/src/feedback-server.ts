import express from 'express';
import { drizzleFeedbackRepository } from '@the-new-fuse/database';

const app = express();
app.use(express.json());

app.post('/api/feedback', async (req, res) => {
  try {
    const { type, message, source, contextUrl, priority, reporterName, reporterEmail } = req.body;
    const result = await drizzleFeedbackRepository.create({
      type, message, source, contextUrl, priority, reporterName, reporterEmail
    });
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/feedback', async (req, res) => {
  try {
    const { status, type, limit, offset } = req.query;
    const result = await drizzleFeedbackRepository.findAll({
      status: status as string,
      type: type as string,
      limit: limit ? Number(limit) : undefined,
      offset: offset ? Number(offset) : undefined
    });
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/feedback/stats', async (req, res) => {
  try {
    const result = await drizzleFeedbackRepository.getStats();
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

const port = Number(process.env.PORT || 3001);
app.listen(port, '0.0.0.0', () => {
  console.log(`Feedback API listening on port ${port}`);
});