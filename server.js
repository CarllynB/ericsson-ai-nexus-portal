
import express from 'express';
import https from 'https';
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Enhanced CORS configuration
app.use(cors({
  origin: [
    'https://aiduagent-csstip.ckit1.explab.com',
    'https://localhost:443',
    'https://localhost',
    'http://localhost:8080',
    'http://localhost'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept']
}));

// Security headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

// Parse JSON bodies
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static files from dist directory with proper headers
app.use(express.static(path.join(__dirname, 'dist'), {
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.js')) {
      res.setHeader('Content-Type', 'application/javascript');
    } else if (filePath.endsWith('.css')) {
      res.setHeader('Content-Type', 'text/css');
    } else if (filePath.endsWith('.html')) {
      res.setHeader('Content-Type', 'text/html');
    }
  }
}));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API routes (if any) should go here before the catch-all

// Handle React Router routes - catch all and serve index.html
app.get('*', (req, res) => {
  try {
    const indexPath = path.join(__dirname, 'dist', 'index.html');
    console.log(`Serving request for: ${req.url}`);
    console.log(`Looking for index.html at: ${indexPath}`);
    
    if (fs.existsSync(indexPath)) {
      res.sendFile(indexPath);
    } else {
      console.error('index.html not found at:', indexPath);
      res.status(404).send(`
        <html>
          <body>
            <h1>Application Not Built</h1>
            <p>The dist directory or index.html was not found.</p>
            <p>Please run 'npm run build' first.</p>
            <p>Looking for: ${indexPath}</p>
          </body>
        </html>
      `);
    }
  } catch (error) {
    console.error('Error serving file:', error);
    res.status(500).send(`
      <html>
        <body>
          <h1>Server Error</h1>
          <p>An error occurred while serving the application.</p>
          <p>Error: ${error.message}</p>
        </body>
      </html>
    `);
  }
});

// Global error handling middleware
app.use((error, req, res, next) => {
  console.error('Unhandled server error:', error);
  res.status(500).json({
    error: 'Internal Server Error',
    message: error.message,
    timestamp: new Date().toISOString()
  });
});

// Check for SSL certificates
const certPath = path.join(__dirname, 'aiduagent-csstip.ckit1.explab.com.crt');
const keyPath = path.join(__dirname, 'aiduagent-csstip.ckit1.explab.com.key');

const certExists = fs.existsSync(certPath);
const keyExists = fs.existsSync(keyPath);

console.log('SSL Certificate check:');
console.log(`Certificate exists: ${certExists} (${certPath})`);
console.log(`Key exists: ${keyExists} (${keyPath})`);

if (certExists && keyExists) {
  try {
    // HTTPS Configuration
    const httpsOptions = {
      cert: fs.readFileSync(certPath),
      key: fs.readFileSync(keyPath)
    };

    const HTTPS_PORT = process.env.PORT || 443;

    const httpsServer = https.createServer(httpsOptions, app);
    
    httpsServer.listen(HTTPS_PORT, '0.0.0.0', () => {
      console.log('🚀 HTTPS Server running successfully!');
      console.log(`📡 Port: ${HTTPS_PORT}`);
      console.log(`🌐 Access URLs:`);
      console.log(`   - https://aiduagent-csstip.ckit1.explab.com/`);
      console.log(`   - https://localhost:${HTTPS_PORT}/`);
      console.log(`📁 Serving from: ${path.join(__dirname, 'dist')}`);
    });

    httpsServer.on('error', (error) => {
      console.error('HTTPS Server error:', error);
      if (error.code === 'EACCES') {
        console.error('⚠️  Permission denied. Try running with sudo for port 443');
      } else if (error.code === 'EADDRINUSE') {
        console.error(`⚠️  Port ${HTTPS_PORT} is already in use`);
      }
      process.exit(1);
    });

  } catch (error) {
    console.error('Error setting up HTTPS server:', error);
    console.log('Falling back to HTTP mode...');
    startHttpServer();
  }
} else {
  console.log('⚠️  SSL certificates not found, starting HTTP server...');
  startHttpServer();
}

function startHttpServer() {
  const HTTP_PORT = process.env.PORT || 8080;
  
  const httpServer = http.createServer(app);
  
  httpServer.listen(HTTP_PORT, '0.0.0.0', () => {
    console.log('🚀 HTTP Server running successfully!');
    console.log(`📡 Port: ${HTTP_PORT}`);
    console.log(`🌐 Access URL: http://localhost:${HTTP_PORT}/`);
    console.log(`📁 Serving from: ${path.join(__dirname, 'dist')}`);
    console.log('⚠️  Note: Running in HTTP mode (SSL certificates not found)');
  });

  httpServer.on('error', (error) => {
    console.error('HTTP Server error:', error);
    if (error.code === 'EADDRINUSE') {
      console.error(`⚠️  Port ${HTTP_PORT} is already in use`);
    }
    process.exit(1);
  });
}
