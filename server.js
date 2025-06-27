
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

// Handle React Router routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// HTTPS Configuration
const httpsOptions = {
  cert: fs.readFileSync('./aiduagent-csstip.ckit1.explab.com.crt'),
  key: fs.readFileSync('./aiduagent-csstip.ckit1.explab.com.key') // You'll need to get this file
};

const PORT = process.env.PORT || 443;

https.createServer(httpsOptions, app).listen(PORT, '0.0.0.0', () => {
  console.log(`HTTPS Server running on port ${PORT}`);
  console.log(`Access your app at: https://aiduagent-csstip.ckit1.explab.com/`);
});
