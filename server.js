
const express = require('express');
const https = require('https');
const http = require('http');
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

// Check if we're in offline mode (no SSL certificates or explicit offline mode)
const isOfflineMode = process.env.VITE_OFFLINE_MODE === 'true' || 
                     !fs.existsSync('./aiduagent-csstip.ckit1.explab.com.crt') ||
                     !fs.existsSync('./aiduagent-csstip.ckit1.explab.com.key');

const PORT = process.env.PORT || (isOfflineMode ? 8080 : 443);

if (isOfflineMode) {
  // HTTP server for offline mode
  http.createServer(app).listen(PORT, '0.0.0.0', () => {
    console.log(`HTTP Server running on port ${PORT} (Offline Mode)`);
    console.log(`Access your app at: http://localhost:${PORT}/`);
  });
} else {
  // HTTPS server for production
  const httpsOptions = {
    cert: fs.readFileSync('./aiduagent-csstip.ckit1.explab.com.crt'),
    key: fs.readFileSync('./aiduagent-csstip.ckit1.explab.com.key')
  };

  https.createServer(httpsOptions, app).listen(PORT, '0.0.0.0', () => {
    console.log(`HTTPS Server running on port ${PORT}`);
    console.log(`Access your app at: https://aiduagent-csstip.ckit1.explab.com/`);
  });
}
