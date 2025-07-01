
import express from 'express';
import https from 'https';
import http from 'http';
import fs from 'fs';
import path from 'path';
import cors from 'cors';
import { setupDatabase } from './database';
import { authRoutes } from './routes/auth';
import { agentRoutes } from './routes/agents';
import { roleRoutes } from './routes/roles';
import { sidebarRoutes } from './routes/sidebar';
import { novaRoutes } from './routes/nova';
import { authenticateToken, requireRole } from './middleware/auth';
import { fileURLToPath } from 'url';

const app = express();

// Add request logging middleware
app.use((req, res, next) => {
  console.log(`📨 ${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Enable CORS with specific options
app.use(cors({
  origin: true,
  credentials: true
}));
app.use(express.json());

// Add debug logging for route registration
console.log('🔧 Registering API routes with debug logging...');

// API Routes with error handling and debug logging
try {
  console.log('📝 Registering auth routes at /api/auth');
  app.use('/api/auth', (req, res, next) => {
    console.log('🔑 Auth route accessed:', req.method, req.url);
    next();
  }, authRoutes);
  console.log('✅ Auth routes registered successfully');

  console.log('📝 Registering agent routes at /api/agents');
  app.use('/api/agents', agentRoutes);
  console.log('✅ Agent routes registered successfully');

  console.log('📝 Registering role routes at /api/roles');
  app.use('/api/roles', roleRoutes);
  console.log('✅ Role routes registered successfully');

  console.log('📝 Registering sidebar routes at /api/sidebar');
  app.use('/api/sidebar', sidebarRoutes);
  console.log('✅ Sidebar routes registered successfully');

  console.log('📝 Registering nova routes at /api/nova');
  app.use('/api/nova', novaRoutes);
  console.log('✅ Nova routes registered successfully');

  console.log('✅ All API routes registered successfully');
} catch (error) {
  console.error('❌ Error registering API routes:', error);
  process.exit(1);
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  console.log('💓 Health check requested');
  res.json({ 
    status: 'ok', 
    database: 'connected',
    timestamp: new Date().toISOString()
  });
});

// Serve static files from dist directory in production
if (process.env.NODE_ENV === 'production') {
  const distPath = path.join(process.cwd(), 'dist');
  console.log('📁 Serving static files from:', distPath);
  
  if (fs.existsSync(distPath)) {
    app.use(express.static(distPath));
    console.log('✅ Static files middleware registered');
    
    // Serve index.html for all non-API routes (React Router support)
    app.get('*', (req, res, next) => {
      console.log('🌐 Wildcard route hit:', req.path);
      
      // Only serve index.html for non-API routes and non-static files
      if (!req.path.startsWith('/api') && !req.path.includes('.')) {
        const indexPath = path.join(distPath, 'index.html');
        if (fs.existsSync(indexPath)) {
          console.log('📄 Serving index.html for:', req.path);
          res.sendFile(indexPath);
        } else {
          console.log('❌ index.html not found at:', indexPath);
          res.status(404).send('index.html not found');
        }
      } else {
        console.log('⏭️ Skipping wildcard for:', req.path);
        next();
      }
    });
    console.log('✅ Wildcard route registered for React Router');
  } else {
    console.warn('⚠️ Dist directory not found:', distPath);
  }
}

// Global error handler - MUST be last middleware
app.use((error: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('🚨 CRITICAL ERROR:', error);
  console.error('Stack trace:', error.stack);
  res.status(500).json({ error: 'Internal server error' });
});

// Initialize database when the module is loaded
setupDatabase().then(() => {
  console.log('✅ Database initialized for backend server');
}).catch((error) => {
  console.error('❌ Failed to initialize database:', error);
});

// Export the app and middleware for use in other files
export { app, authenticateToken, requireRole };

// Only start standalone server if this file is run directly (ES modules way)
const __filename = fileURLToPath(import.meta.url);
const isMainModule = process.argv[1] === __filename;

if (isMainModule) {
  const startServer = async () => {
    try {
      // Use port 443 for production, 8081 for development
      const PORT = parseInt(process.env.PORT || (process.env.NODE_ENV === 'production' ? '443' : '8081'), 10);
      console.log('🔧 Starting server on port:', PORT);

      // Check for SSL certificates
      const sslCertExists = fs.existsSync('./aiduagent-csstip.ckit1.explab.com.crt');
      const sslKeyExists = fs.existsSync('./aiduagent-csstip.ckit1.explab.com.key');

      if (sslCertExists && sslKeyExists) {
        try {
          const httpsOptions = {
            cert: fs.readFileSync('./aiduagent-csstip.ckit1.explab.com.crt'),
            key: fs.readFileSync('./aiduagent-csstip.ckit1.explab.com.key'),
            // Force HTTP/1.1 to avoid Node.js HTTP/2 issues
            allowHTTP1: true
          };

          const server = https.createServer(httpsOptions, app);
          
          server.on('error', (error) => {
            console.error('🚨 HTTPS Server Error:', error);
          });

          server.listen(PORT, '0.0.0.0', () => {
            console.log(`🔒 HTTPS Server running on port ${PORT}`);
            console.log(`🌐 Public URL: https://aiduagent-csstip.ckit1.explab.com`);
            console.log(`🔧 Local HTTPS: https://localhost:${PORT}`);
            console.log(`🔍 API Health: https://aiduagent-csstip.ckit1.explab.com/api/health`);
          });
        } catch (sslError) {
          console.warn('⚠️ SSL certificate error, falling back to HTTP:', sslError.message);
          startHttpServer(PORT);
        }
      } else {
        console.log('ℹ️ SSL certificates not found, starting HTTP server');
        startHttpServer(PORT);
      }
    } catch (error) {
      console.error('❌ Failed to start server:', error);
      process.exit(1);
    }
  };

  const startHttpServer = (port: number) => {
    const server = http.createServer(app);
    
    server.on('error', (error) => {
      console.error('🚨 HTTP Server Error:', error);
    });

    server.listen(port, '0.0.0.0', () => {
      console.log(`🌐 HTTP Server running on port ${port}`);
      console.log(`🔧 Local HTTP: http://localhost:${port}`);
      console.log(`🔍 API Health: http://localhost:${port}/api/health`);
    });
  };

  // Catch unhandled errors
  process.on('uncaughtException', (error) => {
    console.error('🚨 UNCAUGHT EXCEPTION:', error);
    console.error('Stack:', error.stack);
  });

  process.on('unhandledRejection', (reason, promise) => {
    console.error('🚨 UNHANDLED REJECTION at:', promise, 'reason:', reason);
  });

  startServer();
}
