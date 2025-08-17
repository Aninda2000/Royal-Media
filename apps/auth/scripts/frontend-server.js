#!/usr/bin/env node

const express = require('express');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.FRONTEND_PORT || 3000;

// Enable CORS for API requests
app.use(cors());

// Serve static files from public directory
app.use(express.static(path.join(__dirname, '../public')));

// Serve index.html for all routes (SPA behavior)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

app.listen(PORT, () => {
  console.log('🚀 Royal Media Auth Frontend Server Started');
  console.log('==================================================');
  console.log(`📋 Frontend URL: http://localhost:${PORT}`);
  console.log(`🔗 API URL: http://localhost:3001`);
  console.log('==================================================');
  console.log('© Design and Developed by Aninda Sundar Roy');
  console.log('==================================================');
});