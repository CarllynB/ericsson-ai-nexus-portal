
import express from 'express';
import https from 'https';
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

// Enable CORS with specific options
app.use(cors({
  origin: true,
  credentials: true
}));
app.use(express.json());

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/agents', agentRoutes);
app.use('/api/roles', roleRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    database: 'connected',
    timestamp: new Date().toISOString()
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

// Initialize database when the module is loaded
setupDatabase().then(() => {
  console.log('✅ Database initialized for all-in-one server');
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
      const PORT = parseInt(process.env.PORT || '8080', 10);

      // For development, use HTTP to avoid compatibility issues
      if (process.env.NODE_ENV === 'development') {
        app.listen(PORT, '0.0.0.0', () => {
          console.log(`🚀 HTTP Backend Server running on port ${PORT}`);
          console.log(`🔧 Backend API: http://localhost:${PORT}`);
          console.log(`🔍 API Health: http://localhost:${PORT}/api/health`);
        });
        return;
      }

      // For production, try HTTPS first, fall back to HTTP
      const sslCertExists = fs.existsSync('./aiduagent-csstip.ckit1.explab.com.crt');
      const sslKeyExists = fs.existsSync('./aiduagent-csstip.ckit1.explab.com.key');

      if (sslCertExists && sslKeyExists) {
        try {
          const httpsOptions = {
            cert: fs.readFileSync('./aiduagent-csstip.ckit1.explab.com.crt'),
            key: fs.readFileSync('./aiduagent-csstip.ckit1.explab.com.key')
          };

          https.createServer(httpsOptions, app).listen(PORT, '0.0.0.0', () => {
            console.log(`🚀 HTTPS Production Server running on port ${PORT}`);
            console.log(`🔒 Access your app at: https://aiduagent-csstip.ckit1.explab.com/`);
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
    app.listen(port, '0.0.0.0', () => {
      console.log(`🚀 HTTP Production Server running on port ${port}`);
      console.log(`🌐 Access your app at: http://localhost:${port}`);
      console.log(`🔍 API Health: http://localhost:${port}/api/health`);
    });
  };

  startServer();
}
