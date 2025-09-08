const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { v4: uuidv4 } = require('uuid'); // For unique IDs if needed
const fs = require('fs'); // For file-based logging

const app = express();
const PORT = 3001;
const BASE_URL = `http://localhost:${PORT}`;

// In-memory storage
const urls = new Map(); // shortcode -> { originalUrl, createdAt, expiryAt, clickCount: 0, clicks: [] }
const clicks = new Map(); // shortcode -> array of { timestamp, referrer, location }

// Logging Middleware (custom, as per requirement - logs to file, no console)
const loggingMiddleware = (req, res, next) => {
  const start = Date.now();
  const logEntry = `[${new Date().toISOString()}] ${req.method} ${req.url} - Body: ${JSON.stringify(req.body)}`;
  fs.appendFileSync('app.log', logEntry + '\n');
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const logEnd = ` - Status: ${res.statusCode} - Duration: ${duration}ms`;
    fs.appendFileSync('app.log', logEnd + '\n');
  });
  next();
};

app.use(cors());
app.use(bodyParser.json());
app.use(loggingMiddleware); // Mandatory logging

// Helper: Generate random shortcode (6 chars, alphanumeric)
function generateShortcode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// Helper: Validate URL
function isValidUrl(string) {
  try {
    new URL(string);
    return true;
  } catch {
    return false;
  }
}

// Helper: Check if shortcode exists and is unique/valid
function getUniqueShortcode(desired) {
  if (!desired || !/^[a-zA-Z0-9]{4,10}$/.test(desired)) return generateShortcode();
  if (urls.has(desired)) return getUniqueShortcode(); // Recursive for uniqueness
  return desired;
}

// POST /shorturls - Create Short URL
app.post('/shorturls', (req, res) => {
  try {
    const { url, validity = 30, shortcode } = req.body;
    
    if (!isValidUrl(url)) {
      return res.status(400).json({ error: 'Invalid URL format' });
    }
    
    const expiryAt = new Date(Date.now() + validity * 60 * 1000).toISOString();
    const generatedShortcode = getUniqueShortcode(shortcode);
    
    urls.set(generatedShortcode, {
      originalUrl: url,
      createdAt: new Date().toISOString(),
      expiryAt,
      clickCount: 0,
      clicks: []
    });
    
    clicks.set(generatedShortcode, []); // Init clicks array
    
    res.status(201).json({
      shortlink: `${BASE_URL}/${generatedShortcode}`,
      expiry: expiryAt
    });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /:shortcode - Redirect (and track click)
app.get('/:shortcode', (req, res) => {
  const { shortcode } = req.params;
  const urlData = urls.get(shortcode);
  
  if (!urlData) {
    return res.status(404).json({ error: 'Shortcode not found' });
  }
  
  const now = new Date();
  if (now > new Date(urlData.expiryAt)) {
    return res.status(410).json({ error: 'Short link expired' });
  }
  
  // Track click
  const clickData = {
    timestamp: now.toISOString(),
    referrer: req.get('Referer') || 'Direct',
    location: 'Mock Location: India' // Coarse-grained mock; replace with IP geo API in prod
  };
  urlData.clicks.push(clickData);
  urlData.clickCount++;
  clicks.set(shortcode, urlData.clicks);
  
  // Log the click (via middleware already)
  res.redirect(301, urlData.originalUrl);
});

// GET /shorturls/:shortcode - Retrieve Statistics
app.get('/shorturls/:shortcode', (req, res) => {
  const { shortcode } = req.params;
  const urlData = urls.get(shortcode);
  
  if (!urlData) {
    return res.status(404).json({ error: 'Shortcode not found' });
  }
  
  const now = new Date();
  if (now > new Date(urlData.expiryAt)) {
    return res.status(410).json({ error: 'Short link expired' });
  }
  
  res.json({
    originalUrl: urlData.originalUrl,
    createdAt: urlData.createdAt,
    expiryAt: urlData.expiryAt,
    totalClicks: urlData.clickCount,
    clicks: urlData.clicks // Array of {timestamp, referrer, location}
  });
});

// Error handling middleware (global)
app.use((err, req, res, next) => {
  res.status(500).json({ error: 'Something went wrong!' });
});

app.listen(PORT, () => {
  // Log startup (via file)
  fs.appendFileSync('app.log', `[Startup] Server running on port ${PORT}\n`);
});