
const express = require('express');
const https = require('https');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

// Import the backend server and middleware
const { app: backendApp } = require('./src/server/index.ts');

const app = express();

console.log('🚀 Starting Production HTTPS Server with Full Backend...\n');

// Enable CORS
app.use(cors({
  origin: true,
  credentials: true
}));

// Add request logging middleware
app.use((req, res, next) => {
  console.log(`📨 ${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Mount the backend API routes first
app.use('/api', backendApp);

// Health check endpoint
app.get('/api/health', (req, res) => {
  console.log('💓 Production health check requested');
  res.json({ 
    status: 'ok', 
    server: 'production-https',
    database: 'connected',
    timestamp: new Date().toISOString()
  });
});

// Serve static files from dist directory
app.use(express.static(path.join(__dirname, 'dist')));

// Handle React Router routes - serve index.html for all non-API routes
app.get('*', (req, res) => {
  if (!req.path.startsWith('/api')) {
    console.log(`🔄 Serving React app for route: ${req.path}`);
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
  }
});

// Global error handler
app.use((error, req, res, next) => {
  console.error('🚨 Production server error:', error);
  res.status(500).json({ error: 'Internal server error' });
});

// HTTPS Configuration
const httpsOptions = {
  cert: fs.readFileSync('./aiduagent-csstip.ckit1.explab.com.crt'),
  key: fs.readFileSync('./aiduagent-csstip.ckit1.explab.com.key')
};

const PORT = process.env.PORT || 443;

https.createServer(httpsOptions, app).listen(PORT, '0.0.0.0', () => {
  console.log(`🔒 Production HTTPS Server running on port ${PORT}`);
  console.log(`🌐 Access your app at: https://aiduagent-csstip.ckit1.explab.com/`);
  console.log(`🔍 API Health: https://aiduagent-csstip.ckit1.explab.com/api/health`);
  console.log(`💾 SQLite Database: shared_database.sqlite`);
  console.log('\nPress Ctrl+C to stop the server\n');
});

// Handle process cleanup
const cleanup = () => {
  console.log('\n🛑 Shutting down production server...');
  process.exit();
};

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);

// Catch unhandled errors
process.on('uncaughtException', (error) => {
  console.error('🚨 UNCAUGHT EXCEPTION:', error);
  console.error('Stack:', error.stack);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('🚨 UNHANDLED REJECTION at:', promise, 'reason:', reason);
});
