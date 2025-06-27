
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
app.use(cors({
  origin: true,
  credentials: true
}));

// Serve static files from dist directory
app.use(express.static(path.join(__dirname, 'dist')));

// Handle React Router routes - catch all and serve index.html
app.get('*', (req, res) => {
  try {
    const indexPath = path.join(__dirname, 'dist', 'index.html');
    if (fs.existsSync(indexPath)) {
      res.sendFile(indexPath);
    } else {
      res.status(404).send('Application not built. Please run npm run build first.');
    }
  } catch (error) {
    console.error('Error serving file:', error);
    res.status(500).send('Server Error');
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).send('Something went wrong!');
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
    console.log(`Local access: https://localhost:${PORT}/`);
  });
} else {
  // HTTP fallback
  const PORT = process.env.PORT || 8080;
  
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`HTTP Server running on port ${PORT}`);
    console.log(`Access your app at: http://localhost:${PORT}/`);
    console.log('Note: SSL certificates not found, running in HTTP mode');
  });
}
