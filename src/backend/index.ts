import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { deploymentRouter } from './routes/deployment.js';

for (const dir of ['copilot_session', 'template_repo', 'user_repo']) {
  const dirPath = path.join(process.cwd(), 'temp', dir);
  if (!fs.existsSync(dirPath)) fs.mkdirSync(dirPath, { recursive: true });
}

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
