
import express from 'express';
import https from 'https';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Enable CORS
app.use(cors());

// Serve static files from dist directory
app.use(express.static(path.join(__dirname, 'dist')));

// Handle React Router routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Check if certificates exist
const certExists = fs.existsSync('./aiduagent-csstip.ckit1.explab.com.crt');
const keyExists = fs.existsSync('./aiduagent-csstip.ckit1.explab.com.key');

if (certExists && keyExists) {
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
} else {
  // HTTP fallback
  const PORT = process.env.PORT || 8080;
  
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`HTTP Server running on port ${PORT}`);
    console.log(`Access your app at: http://localhost:${PORT}/`);
  });
}
