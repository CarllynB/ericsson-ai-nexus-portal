
const express = require('express');
const https = require('https');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();

// Enable CORS
app.use(cors());

// Serve static files from dist directory
app.use(express.static(path.join(__dirname, 'dist')));

// Handle React Router routes - fix the wildcard route
app.get('*', (req, res) => {
  // Only serve index.html for non-API routes and non-static files
  if (!req.path.startsWith('/api') && !req.path.includes('.')) {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
  } else {
    res.status(404).send('Not Found');
  }
});

// HTTPS Configuration
const httpsOptions = {
  cert: fs.readFileSync('./aiduagent-csstip.ckit1.explab.com.crt'),
  key: fs.readFileSync('./aiduagent-csstip.ckit1.explab.com.key')
};

const PORT = process.env.PORT || 443;

https.createServer(httpsOptions, app).listen(PORT, '0.0.0.0', () => {
  console.log(`HTTPS Server running on port ${PORT}`);
  console.log(`Access your app at: https://aiduagent-csstip.ckit1.explab.com/`);
});
