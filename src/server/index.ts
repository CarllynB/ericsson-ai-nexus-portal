
import express from 'express';
import https from 'https';
import fs from 'fs';
import path from 'path';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { setupDatabase, db } from './database';
import { authRoutes } from './routes/auth';
import { agentRoutes } from './routes/agents';
import { roleRoutes } from './routes/roles';

const app = express();

// Enable CORS
app.use(cors());
app.use(express.json());

// JWT Secret (in production, this should be from environment variables)
export const JWT_SECRET = 'your-jwt-secret-key-change-in-production';

// Middleware to verify JWT token
export const authenticateToken = (req: any, res: any, next: any) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.sendStatus(401);
  }

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

// Role-based middleware
export const requireRole = (allowedRoles: string[]) => {
  return (req: any, res: any, next: any) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
  };
};

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/agents', agentRoutes);
app.use('/api/roles', roleRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', database: 'connected' });
});

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../../dist')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../../dist/index.html'));
  });
}

// Initialize database and start server
const startServer = async () => {
  try {
    await setupDatabase();
    console.log('✅ Database initialized successfully');

    const PORT = parseInt(process.env.PORT || '8080', 10);

    // Check if SSL certificates exist for HTTPS
    const sslCertExists = fs.existsSync('./aiduagent-csstip.ckit1.explab.com.crt');
    const sslKeyExists = fs.existsSync('./aiduagent-csstip.ckit1.explab.com.key');

    if (sslCertExists && sslKeyExists) {
      const httpsOptions = {
        cert: fs.readFileSync('./aiduagent-csstip.ckit1.explab.com.crt'),
        key: fs.readFileSync('./aiduagent-csstip.ckit1.explab.com.key')
      };

      https.createServer(httpsOptions, app).listen(PORT, '0.0.0.0', () => {
        console.log(`🚀 HTTPS Server running on port ${PORT}`);
        console.log(`🔒 Access your app at: https://aiduagent-csstip.ckit1.explab.com/`);
      });
    } else {
      app.listen(PORT, '0.0.0.0', () => {
        console.log(`🚀 HTTP Server running on port ${PORT}`);
        console.log(`🌐 Access your app at: http://localhost:${PORT}`);
      });
    }
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Only start server if this file is run directly (not during Vite dev)
if (require.main === module) {
  startServer();
}

export { app };
