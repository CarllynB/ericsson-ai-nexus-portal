
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

// API Routes with error handling
app.use('/api/auth', (req, res, next) => {
  console.log('🔑 Auth route accessed:', req.method, req.url);
  next();
}, authRoutes);

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
    timestamp: new Date().toISOString(),
    port: process.env.PORT || 'unknown',
    environment: process.env.NODE_ENV || 'development'
  });
});

// Serve static files from dist directory in production
if (process.env.NODE_ENV === 'production') {
  const distPath = path.join(process.cwd(), 'dist');
  app.use(express.static(distPath));
  
  // Serve index.html for all non-API routes (React Router support)
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api')) {
      res.sendFile(path.join(distPath, 'index.html'));
    }
  });
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
      // Default ports: dev on 8081, production on 443
      let PORT = parseInt(process.env.PORT || '8081', 10);
      
      // Special handling for lab production (port 443)
      if (process.env.NODE_ENV === 'production' && (process.env.PORT === '443' || process.env.FORCE_HTTPS)) {
        PORT = 443;
      }

      console.log(`🌐 Starting server in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);

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
          
          server.on('error', (error: any) => {
            console.error('🚨 HTTPS Server Error:', error);
            if (error.code === 'EACCES' && PORT < 1024) {
              console.error('💡 Port access denied. Try running with sudo for port 443');
            }
          });

          server.listen(PORT, '0.0.0.0', () => {
            console.log(`🔒 HTTPS Server running on port ${PORT}`);
            console.log(`🔧 API: https://localhost:${PORT}`);
            console.log(`🔍 Health: https://localhost:${PORT}/api/health`);
            if (PORT === 443) {
              console.log(`🌐 Lab URL: https://aiduagent-csstip.ckit1.explab.com`);
            }
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
    
    server.on('error', (error: any) => {
      console.error('🚨 HTTP Server Error:', error);
      if (error.code === 'EACCES' && port < 1024) {
        console.error('💡 Port access denied. Try running with sudo for privileged ports');
      }
    });

    server.listen(port, '0.0.0.0', () => {
      console.log(`🌐 HTTP Server running on port ${port}`);
      console.log(`🔧 API: http://localhost:${port}`);
      console.log(`🔍 Health: http://localhost:${port}/api/health`);
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
