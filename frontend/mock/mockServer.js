const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '.env') });
require('dotenv').config({ path: path.join(__dirname, '.env.local') });

const app = express();

// Configuration from environment variables
const PORT = process.env.MOCK_PORT || 5001;
const MOCK_NETWORK_DELAY = parseInt(process.env.MOCK_NETWORK_DELAY || '1000'); // Simulate network delay in milliseconds
const ALLOWED_ORIGINS = process.env.MOCK_ALLOWED_ORIGINS 
  ? process.env.MOCK_ALLOWED_ORIGINS.split(',').map(origin => origin.trim())
  : ['http://localhost:3000', 'http://localhost:5001', 'http://localhost:5000'];

app.use(cors({
  origin: ALLOWED_ORIGINS,
  credentials: false,
}));

// Security headers middleware
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  next();
});

// Helper to load JSON mock data
function loadMockData(filename) {
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
    }, MOCK_NETWORK_DELAY); // Simulate network delay
  });
}

// Mock endpoint for user profile
app.get('/api/users/:userId/profile', async (req, res) => {
  try {
    const data = await loadMockData('mockUserProfile.json');
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to load mock data' });
  }
});

// Add more endpoints as needed for other mock data

app.listen(PORT, () => {
  console.log(`Mock API server running at http://localhost:${PORT}/api`);
});