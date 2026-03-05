import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { deploymentRouter } from './routes/deployment.js';


const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.use('/api/deployment', deploymentRouter);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Fabric Automation Service is running' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
});
