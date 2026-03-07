import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const PORT = Number(process.env.PORT || 3000);

app.use(
  express.static(path.join(__dirname, 'public'), {
    maxAge: '1h',
  })
);

app.get('/health', (_req, res) => {
  res.json({ ok: true, service: 'caring-liberation-website' });
});

app.get('*', (_req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`website listening on ${PORT}`);
});
