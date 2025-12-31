import express from 'express';

const app = express();
app.use(express.json());

app.get('/', (req, res) => {
  res.json({ msg: 'hello' });
});

const server = app.listen(5000, '127.0.0.1', () => {
  console.log('Minimal server listening on 127.0.0.1:5000');
});

server.on('error', (err) => {
  console.error('Server error:', err);
});
