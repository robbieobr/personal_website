import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import 'dotenv/config';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load optional local override
import('dotenv').then(({ config }) => {
  config({ path: path.join(__dirname, '.env.local') });
});

const app = express();

const PORT = process.env.MOCK_PORT || 5001;
const MOCK_NETWORK_DELAY = parseInt(process.env.MOCK_NETWORK_DELAY || '1000');
const ALLOWED_ORIGINS = process.env.MOCK_ALLOWED_ORIGINS
  ? process.env.MOCK_ALLOWED_ORIGINS.split(',').map((o) => o.trim())
  : ['http://localhost:3000', 'http://localhost:5001', 'http://localhost:5000'];

app.use(cors({ origin: ALLOWED_ORIGINS, credentials: false }));

app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  next();
});

function loadMockData(filename: string): Promise<unknown> {
  const filePath = path.join(__dirname, filename);
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) return reject(err);
        try {
          resolve(JSON.parse(data));
        } catch (parseErr) {
          reject(parseErr);
        }
      });
    }, MOCK_NETWORK_DELAY);
  });
}

app.get('/api/users/:userId/profile', async (req, res) => {
  try {
    const data = await loadMockData('mockUserProfile.json');
    res.json(data);
  } catch {
    res.status(500).json({ error: 'Failed to load mock data' });
  }
});

app.listen(PORT, () => {
  console.log(`Mock API server running at http://localhost:${PORT}/api`);
});
