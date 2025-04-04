import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import auditRouter from './routes/audit';

const app = express();
const port = 3001;

app.use(express.json());
app.use('/analyze', auditRouter);

// Basic health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'audit-engine' });
});

app.listen(port, () => {
  console.log(`Audit Engine API is running on port ${port}`);
}); 