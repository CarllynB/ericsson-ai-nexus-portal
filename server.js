
import express from 'express';
import https from 'https';
import http from 'http';
import fs from 'fs';
import path from 'path';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Compile TypeScript files first
const compileTypeScript = () => {
  return new Promise((resolve, reject) => {
    console.log('🔧 Compiling TypeScript files...');
    const tscProcess = spawn('npx', ['tsc', '--project', 'tsconfig.app.json'], {
      stdio: 'inherit'
    });

    tscProcess.on('close', (code) => {
      if (code === 0) {
        console.log('✅ TypeScript compilation successful');
        resolve();
      } else {
        console.error('❌ TypeScript compilation failed');
        reject(new Error(`TypeScript compilation failed with code ${code}`));
      }
    });

    tscProcess.on('error', (error) => {
      console.error('❌ Failed to start TypeScript compiler:', error);
      reject(error);
    });
  });
};

const startServer = async () => {
  try {
    // Compile TypeScript first
    await compileTypeScript();

    // Now dynamically import the compiled JavaScript modules
    const { setupDatabase } = await import('./dist/server/database.js');
    const { authRoutes } = await import('./dist/server/routes/auth.js');
    const { agentRoutes } = await import('./dist/server/routes/agents.js');
    const { roleRoutes } = await import('./dist/server/routes/roles.js');
    const { sidebarRoutes } = await import('./dist/server/routes/sidebar.js');
    const { novaRoutes } = await import('./dist/server/routes/nova.js');

    const app = express();

    // Add request logging middleware
    app.use((req, res, next) => {
      console.log(`📨 ${new Date().toISOString()} - ${req.method} ${req.url} - Host: ${req.get('Host')}`);
      next();
    });

    // Enable CORS with production-ready configuration
    app.use(cors({
      origin: [
        'https://aiduagent-csstip.ckit1.explab.com',
        'http://localhost:8080', // for development fallback
        'https://localhost:8080'
      ],
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization']
    }));

    app.use(express.json({ limit: '10mb' }));
    app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Security headers for production
    app.use((req, res, next) => {
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('X-Frame-Options', 'DENY');
      res.setHeader('X-XSS-Protection', '1; mode=block');
      res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
      next();
    });

    // Backend API routes (MUST be before static files and fallback)
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
      console.log('💓 Health check requested from:', req.ip);
      res.json({ 
        status: 'ok', 
        database: 'connected',
        timestamp: new Date().toISOString(),
        host: req.get('Host'),
        environment: process.env.NODE_ENV || 'production'
      });
    });

    // Serve static files from dist directory
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath, {
      maxAge: '1d',
      etag: true
    }));

    // Handle React Router routes (SPA fallback)
    app.get('*', (req, res) => {
      // Don't serve index.html for API routes
      if (req.path.startsWith('/api')) {
        return res.status(404).json({ error: 'API endpoint not found' });
      }
      
      const indexPath = path.join(distPath, 'index.html');
      if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
      } else {
        res.status(500).send('Application not built. Run: npm run build');
      }
    });

    // Global error handler
    app.use((error, req, res, next) => {
      console.error('🚨 Server Error:', error);
      res.status(500).json({ 
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? error.message : 'Server error occurred'
      });
    });

    // Initialize database before starting server
    const initializeAndStart = async () => {
      try {
        console.log('🗄️ Initializing database...');
        await setupDatabase();
        console.log('✅ Database initialized successfully');
        startProductionServer(app);
      } catch (error) {
        console.error('❌ Failed to initialize database:', error);
        process.exit(1);
      }
    };

    await initializeAndStart();
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Production server startup
const startProductionServer = (app) => {
  const PORT = parseInt(process.env.PORT || '443', 10);
  
  // Check if we're in a production environment
  const isProduction = process.env.NODE_ENV === 'production' || PORT === 443;
  
  console.log('🚀 Starting AI-DU Agent Portal Production Server...');
  console.log(`📍 Environment: ${isProduction ? 'Production' : 'Development'}`);
  
  // Check for SSL certificates
  const certPath = './aiduagent-csstip.ckit1.explab.com.crt';
  const keyPath = './aiduagent-csstip.ckit1.explab.com.key';
  const sslCertExists = fs.existsSync(certPath);
  const sslKeyExists = fs.existsSync(keyPath);

  if (sslCertExists && sslKeyExists) {
    try {
      const httpsOptions = {
        cert: fs.readFileSync(certPath),
        key: fs.readFileSync(keyPath),
        // Additional security options
        secureProtocol: 'TLSv1_2_method',
        honorCipherOrder: true,
        ciphers: [
          'ECDHE-RSA-AES128-GCM-SHA256',
          'ECDHE-RSA-AES256-GCM-SHA384',
          'ECDHE-RSA-AES128-SHA256',
          'ECDHE-RSA-AES256-SHA384'
        ].join(':')
      };

      const server = https.createServer(httpsOptions, app);
      
      // Handle server errors
      server.on('error', (error) => {
        console.error('🚨 HTTPS Server Error:', error);
        if (error.code === 'EACCES') {
          console.error('❌ Permission denied. Run with sudo for port 443');
        } else if (error.code === 'EADDRINUSE') {
          console.error(`❌ Port ${PORT} is already in use`);
        }
        process.exit(1);
      });

      // Start HTTPS server - bind to all interfaces for production
      server.listen(PORT, '0.0.0.0', () => {
        console.log('✅ HTTPS Production Server Started Successfully!');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log(`🔒 HTTPS Server: Running on port ${PORT}`);
        console.log(`🌐 Production URL: https://aiduagent-csstip.ckit1.explab.com/`);
        console.log(`🔍 Health Check: https://aiduagent-csstip.ckit1.explab.com/api/health`);
        console.log(`💾 Static Files: ${path.join(__dirname, 'dist')}`);
        console.log(`🛡️ SSL Certificates: Loaded and Active`);
        console.log(`🗄️ Database: SQLite (shared_database.sqlite)`);
        console.log(`📡 API Routes: Fully Integrated`);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('✨ Ready to accept connections from your domain!');
      });

    } catch (sslError) {
      console.error('❌ SSL Certificate Error:', sslError.message);
      console.error('🔧 Falling back to HTTP server...');
      startHttpFallback(PORT, app);
    }
  } else {
    console.log('⚠️ SSL certificates not found:');
    console.log(`   - Certificate: ${certPath} ${sslCertExists ? '✅' : '❌'}`);
    console.log(`   - Private Key: ${keyPath} ${sslKeyExists ? '✅' : '❌'}`);
    console.log('🔧 Starting HTTP server as fallback...');
    startHttpFallback(PORT === 443 ? 8080 : PORT, app);
  }
};

const startHttpFallback = (port, app) => {
  const server = http.createServer(app);
  
  server.on('error', (error) => {
    console.error('🚨 HTTP Server Error:', error);
    if (error.code === 'EADDRINUSE') {
      console.error(`❌ Port ${port} is already in use`);
    }
    process.exit(1);
  });

  server.listen(port, '0.0.0.0', () => {
    console.log('✅ HTTP Fallback Server Started');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`🌐 HTTP Server: Running on port ${port}`);
    console.log(`🔍 Local Access: http://localhost:${port}`);
    console.log(`💾 Static Files: ${path.join(__dirname, 'dist')}`);
    console.log(`🗄️ Database: SQLite (shared_database.sqlite)`);
    console.log(`📡 API Routes: Fully Integrated`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('⚠️ Running in HTTP mode - SSL certificates needed for HTTPS');
  });
};

// Handle process termination gracefully
process.on('SIGTERM', () => {
  console.log('🛑 Received SIGTERM, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🛑 Received SIGINT, shutting down gracefully...');
  process.exit(0);
});

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  console.error('🚨 UNCAUGHT EXCEPTION:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('🚨 UNHANDLED REJECTION at:', promise, 'reason:', reason);
  process.exit(1);
});

// Start the server
startServer();
