
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
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
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
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// API routes placeholder
app.get('/api/status', (req, res) => {
  res.json({ 
    status: 'running',
    environment: process.env.NODE_ENV || 'development'
  });
});

// Handle React Router routes - catch all and serve index.html
app.get('*', (req, res) => {
  try {
    const indexPath = path.join(__dirname, 'dist', 'index.html');
    console.log(`[${new Date().toISOString()}] Serving request for: ${req.url}`);
    
    if (fs.existsSync(indexPath)) {
      res.sendFile(indexPath);
    } else {
      console.error('[ERROR] index.html not found at:', indexPath);
      res.status(404).send(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Application Not Built</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 40px; }
              .error { color: #d32f2f; }
              .info { color: #1976d2; }
            </style>
          </head>
          <body>
            <h1 class="error">Application Not Built</h1>
            <p>The dist directory or index.html was not found.</p>
            <p class="info">Please run 'npm run build' first.</p>
            <p><strong>Looking for:</strong> ${indexPath}</p>
          </body>
        </html>
      `);
    }
  } catch (error) {
    console.error('[ERROR] Error serving file:', error);
    res.status(500).send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Server Error</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 40px; }
            .error { color: #d32f2f; }
          </style>
        </head>
        <body>
          <h1 class="error">Server Error</h1>
          <p>An error occurred while serving the application.</p>
          <p><strong>Error:</strong> ${error.message}</p>
        </body>
      </html>
    `);
  }
});

// Global error handling middleware
app.use((error, req, res, next) => {
  console.error('[ERROR] Unhandled server error:', error);
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

console.log('🔐 SSL Certificate Status:');
console.log(`   Certificate: ${certExists ? '✅ Found' : '❌ Missing'} (${certPath})`);
console.log(`   Private Key: ${keyExists ? '✅ Found' : '❌ Missing'} (${keyPath})`);

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
      console.log('');
      console.log('🚀 HTTPS Server Successfully Started!');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(`📡 Port: ${HTTPS_PORT}`);
      console.log(`🌐 Access URLs:`);
      console.log(`   🔒 Primary: https://aiduagent-csstip.ckit1.explab.com/`);
      console.log(`   🔒 Local:   https://localhost:${HTTPS_PORT}/`);
      console.log(`📁 Serving:   ${path.join(__dirname, 'dist')}`);
      console.log(`🔐 Mode:      HTTPS (Secure)`);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('');
    });

    httpsServer.on('error', (error) => {
      console.error('❌ HTTPS Server Error:', error.message);
      if (error.code === 'EACCES') {
        console.error('⚠️  Permission denied. Try running with sudo for port 443');
      } else if (error.code === 'EADDRINUSE') {
        console.error(`⚠️  Port ${HTTPS_PORT} is already in use`);
      }
      console.log('🔄 Attempting HTTP fallback...');
      startHttpServer();
    });

  } catch (error) {
    console.error('❌ Error setting up HTTPS server:', error.message);
    console.log('🔄 Falling back to HTTP mode...');
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
    console.log('');
    console.log('🚀 HTTP Server Successfully Started!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`📡 Port: ${HTTP_PORT}`);
    console.log(`🌐 Access URL: http://localhost:${HTTP_PORT}/`);
    console.log(`📁 Serving:    ${path.join(__dirname, 'dist')}`);
    console.log(`⚠️  Mode:      HTTP (Insecure - SSL certificates not found)`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');
  });

  httpServer.on('error', (error) => {
    console.error('❌ HTTP Server Error:', error.message);
    if (error.code === 'EADDRINUSE') {
      console.error(`⚠️  Port ${HTTP_PORT} is already in use`);
    }
    process.exit(1);
  });
}

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 Received SIGTERM, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🛑 Received SIGINT, shutting down gracefully...');
  process.exit(0);
});
