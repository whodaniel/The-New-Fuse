import express from 'express';
const app = express();
const port = process.env.PORT || 8080;

app.get('/ping', (req, res) => {
  res.send('pong');
});

app.get('/', (req, res) => {
  res.send('Minimal Server OK');
});

app.listen(port, () => {
  console.log(`Minimal server running on ${port}`);
});
