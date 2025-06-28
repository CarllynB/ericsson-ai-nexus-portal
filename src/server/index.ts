
import express from 'express';
import https from 'https';
import fs from 'fs';
import path from 'path';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import { setupDatabase } from './database';
import { authRoutes } from './routes/auth';
import { agentRoutes } from './routes/agents';
import { roleRoutes } from './routes/roles';
import { AuthenticatedRequest } from './types';

const app = express();

// Enable CORS with specific options
app.use(cors({
  origin: true,
  credentials: true
}));
app.use(express.json());

// JWT Secret (in production, this should be from environment variables)
export const JWT_SECRET = process.env.JWT_SECRET || 'aiduagent-jwt-secret-key-2024-production';

// Middleware to verify JWT token
export const authenticateToken = (req: AuthenticatedRequest, res: express.Response, next: express.NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    res.sendStatus(401);
    return;
  }

  try {
    const user = jwt.verify(token, JWT_SECRET) as any;
    req.user = user;
    next();
  } catch (err) {
    console.error('JWT verification failed:', err);
    res.sendStatus(403);
    return;
  }
};

// Role-based middleware
export const requireRole = (allowedRoles: string[]) => {
  return (req: AuthenticatedRequest, res: express.Response, next: express.NextFunction) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      res.status(403).json({ error: 'Insufficient permissions' });
      return;
    }
    next();
  };
};

// API Routes
app.use('/auth', authRoutes);
app.use('/agents', agentRoutes);
app.use('/roles', roleRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    database: 'connected',
    timestamp: new Date().toISOString()
  });
});

// Initialize database when the module is loaded
setupDatabase().then(() => {
  console.log('✅ Database initialized for all-in-one server');
}).catch((error) => {
  console.error('❌ Failed to initialize database:', error);
});

// Export the app for use as middleware in Vite
export { app };

// Only start standalone server if this file is run directly
if (require.main === module) {
  const startServer = async () => {
    try {
      const PORT = parseInt(process.env.PORT || '8080', 10);

      // Check if SSL certificates exist for HTTPS
      const sslCertExists = fs.existsSync('./aiduagent-csstip.ckit1.explab.com.crt');
      const sslKeyExists = fs.existsSync('./aiduagent-csstip.ckit1.explab.com.key');

      if (sslCertExists && sslKeyExists) {
        try {
          const httpsOptions = {
            cert: fs.readFileSync('./aiduagent-csstip.ckit1.explab.com.crt'),
            key: fs.readFileSync('./aiduagent-csstip.ckit1.explab.com.key')
          };

          https.createServer(httpsOptions, app).listen(PORT, '0.0.0.0', () => {
            console.log(`🚀 HTTPS Server running on port ${PORT}`);
            console.log(`🔒 Access your app at: https://aiduagent-csstip.ckit1.explab.com/`);
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
      console.log(`🚀 HTTP Server running on port ${port}`);
      console.log(`🌐 Access your app at: http://localhost:${port}`);
    });
  };

  startServer();
}
