
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

// Add error handling middleware for JSON parsing
app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (error instanceof SyntaxError && 'status' in error && error.status === 400 && 'body' in error) {
    console.error('❌ JSON Parse Error:', error.message);
    return res.status(400).json({ error: 'Invalid JSON' });
  }
  next(error);
});

// API Routes with error handling
app.use('/api/auth', (req, res, next) => {
  console.log('🔑 Auth route accessed:', req.method, req.url);
  next();
}, authRoutes);

app.use('/api/agents', agentRoutes);
app.use('/api/roles', roleRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  console.log('💓 Health check requested');
  res.json({ 
    status: 'ok', 
    database: 'connected',
    timestamp: new Date().toISOString()
  });
});

// Global error handler
app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('🚨 CRITICAL ERROR:', error);
  console.error('Stack trace:', error.stack);
  res.status(500).json({ error: 'Internal server error' });
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
      // Backend runs on port 8081, Vite frontend on 8080
      const PORT = parseInt(process.env.PORT || '8081', 10);

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
            console.log(`🔒 HTTPS Backend Server running on port ${PORT}`);
            console.log(`🔧 Backend API: https://localhost:${PORT}`);
            console.log(`🔍 API Health: https://localhost:${PORT}/api/health`);
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
      console.log(`🌐 HTTP Backend Server running on port ${port}`);
      console.log(`🔧 Backend API: http://localhost:${port}`);
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
