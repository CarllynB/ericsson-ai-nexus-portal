
const express = require('express');
const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

// Import the backend app functionality
const { createRequire } = require('module');
const require_esm = createRequire(import.meta.url);

const app = express();

// Add request logging middleware
app.use((req, res, next) => {
  console.log(`📨 ${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Enable CORS
app.use(cors({
  origin: true,
  credentials: true
}));
app.use(express.json());

// Import and setup backend routes
const setupBackendRoutes = async () => {
  try {
    // Dynamic import of ES modules
    const { setupDatabase } = await import('./src/server/database.js');
    const { authRoutes } = await import('./src/server/routes/auth.js');
    const { agentRoutes } = await import('./src/server/routes/agents.js');
    const { roleRoutes } = await import('./src/server/routes/roles.js');
    const { sidebarRoutes } = await import('./src/server/routes/sidebar.js');
    const { novaRoutes } = await import('./src/server/routes/nova.js');

    // Setup database
    await setupDatabase();
    console.log('✅ Database initialized for production server');

    // Setup API routes
    app.use('/api/auth', authRoutes);
    app.use('/api/agents', agentRoutes);
    app.use('/api/roles', roleRoutes);
    app.use('/api/sidebar', sidebarRoutes);
    app.use('/api/nova', novaRoutes);

    // Health check endpoint
    app.get('/api/health', (req, res) => {
      console.log('💓 Health check requested');
      res.json({ 
        status: 'ok', 
        database: 'connected',
        timestamp: new Date().toISOString()
      });
    });

    console.log('✅ Backend API routes loaded successfully');

  } catch (error) {
    console.error('❌ Failed to setup backend routes:', error);
    
    // Fallback error responses for API routes
    app.use('/api/*', (req, res) => {
      console.error('❌ API route not available:', req.path);
      res.status(503).json({ error: 'Backend services unavailable' });
    });
  }
};

// Serve static files from dist directory
app.use(express.static(path.join(__dirname, 'dist')));

// Handle React Router routes (must be after API routes)
app.get('*', (req, res) => {
  // Only serve index.html for non-API routes
  if (!req.path.startsWith('/api')) {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
  }
});

// Global error handler
app.use((error, req, res, next) => {
  console.error('🚨 Production server error:', error);
  res.status(500).json({ error: 'Internal server error' });
});

const startServer = async () => {
  try {
    // Setup backend routes first
    await setupBackendRoutes();

    const PORT = process.env.PORT || 443;

    // Check for SSL certificates
    const sslCertExists = fs.existsSync('./aiduagent-csstip.ckit1.explab.com.crt');
    const sslKeyExists = fs.existsSync('./aiduagent-csstip.ckit1.explab.com.key');

    if (sslCertExists && sslKeyExists) {
      const httpsOptions = {
        cert: fs.readFileSync('./aiduagent-csstip.ckit1.explab.com.crt'),
        key: fs.readFileSync('./aiduagent-csstip.ckit1.explab.com.key')
      };

      https.createServer(httpsOptions, app).listen(PORT, '0.0.0.0', () => {
        console.log(`🔒 HTTPS Production Server running on port ${PORT}`);
        console.log(`🌐 Frontend: https://aiduagent-csstip.ckit1.explab.com/`);
        console.log(`🔧 API Health: https://aiduagent-csstip.ckit1.explab.com/api/health`);
        console.log(`💾 SQLite Database: shared_database.sqlite`);
      });
    } else {
      console.log('ℹ️ SSL certificates not found, starting HTTP server');
      http.createServer(app).listen(PORT, '0.0.0.0', () => {
        console.log(`🌐 HTTP Production Server running on port ${PORT}`);
        console.log(`🔧 API Health: http://localhost:${PORT}/api/health`);
      });
    }
  } catch (error) {
    console.error('❌ Failed to start production server:', error);
    process.exit(1);
  }
};

// Start the server
startServer();
