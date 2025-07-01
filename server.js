import express from 'express';
import https from 'https';
import http from 'http';
import fs from 'fs';
import path from 'path';
import cors from 'cors';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const startServer = async () => {
  try {
    console.log('🚀 Starting AI-DU Agent Portal Production Server (Offline Package)...');
    
    // Check if we can use pre-compiled files, otherwise use source files directly
    const useCompiledFiles = fs.existsSync('./dist/server/database.js');
    
    let setupDatabase, authRoutes, agentRoutes, roleRoutes, sidebarRoutes, novaRoutes;
    
    if (useCompiledFiles) {
      console.log('✅ Using pre-compiled server files');
      try {
        const dbModule = await import('./dist/server/database.js');
        setupDatabase = dbModule.setupDatabase;
        
        const authModule = await import('./dist/server/routes/auth.js');
        authRoutes = authModule.authRoutes;
        
        const agentModule = await import('./dist/server/routes/agents.js');
        agentRoutes = agentModule.agentRoutes;
        
        const roleModule = await import('./dist/server/routes/roles.js');
        roleRoutes = roleModule.roleRoutes;
        
        const sidebarModule = await import('./dist/server/routes/sidebar.js');
        sidebarRoutes = sidebarModule.sidebarRoutes;
        
        const novaModule = await import('./dist/server/routes/nova.js');
        novaRoutes = novaModule.novaRoutes;
      } catch (compiledError) {
        console.log('⚠️ Pre-compiled files failed, falling back to source files');
        console.log('Error:', compiledError.message);
        throw new Error('Compiled files are corrupted, need source fallback');
      }
    } else {
      throw new Error('No compiled files found, need source fallback');
    }
    
    console.log('✅ All server modules imported successfully');

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
        'http://localhost:8080',
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
        environment: 'production-offline',
        package: 'offline-ready'
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
        res.status(500).send('Application not built. Missing dist/index.html');
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
    console.error('Stack trace:', error.stack);
    
    // Try fallback to source files with ts-node
    console.log('🔄 Attempting fallback to source files...');
    try {
      // Import ts-node and register it
      const tsNode = await import('ts-node');
      tsNode.register({
        project: './tsconfig.server.json'
      });
      
      // Now try importing TypeScript source files
      const { setupDatabase } = await import('./src/server/database.ts');
      const { authRoutes } = await import('./src/server/routes/auth.ts');
      const { agentRoutes } = await import('./src/server/routes/agents.ts');
      const { roleRoutes } = await import('./src/server/routes/roles.ts');
      const { sidebarRoutes } = await import('./src/server/routes/sidebar.ts');
      const { novaRoutes } = await import('./src/server/routes/nova.ts');
      
      console.log('✅ Source files loaded successfully');
      
      // Continue with the same server setup
      const app = express();
      
      app.use((req, res, next) => {
        console.log(`📨 ${new Date().toISOString()} - ${req.method} ${req.url} - Host: ${req.get('Host')}`);
        next();
      });

      app.use(cors({
        origin: [
          'https://aiduagent-csstip.ckit1.explab.com',
          'http://localhost:8080',
          'https://localhost:8080'
        ],
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization']
      }));

      app.use(express.json({ limit: '10mb' }));
      app.use(express.urlencoded({ extended: true, limit: '10mb' }));

      app.use((req, res, next) => {
        res.setHeader('X-Content-Type-Options', 'nosniff');
        res.setHeader('X-Frame-Options', 'DENY');
        res.setHeader('X-XSS-Protection', '1; mode=block');
        res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
        next();
      });

      app.use('/api/auth', (req, res, next) => {
        console.log('🔑 Auth route accessed:', req.method, req.url);
        next();
      }, authRoutes);

      app.use('/api/agents', agentRoutes);
      app.use('/api/roles', roleRoutes);
      app.use('/api/sidebar', sidebarRoutes);
      app.use('/api/nova', novaRoutes);

      app.get('/api/health', (req, res) => {
        console.log('💓 Health check requested from:', req.ip);
        res.json({ 
          status: 'ok', 
          database: 'connected',
          timestamp: new Date().toISOString(),
          host: req.get('Host'),
          environment: 'production-offline-fallback',
          package: 'source-files'
        });
      });

      const distPath = path.join(__dirname, 'dist');
      app.use(express.static(distPath, {
        maxAge: '1d',
        etag: true
      }));

      app.get('*', (req, res) => {
        if (req.path.startsWith('/api')) {
          return res.status(404).json({ error: 'API endpoint not found' });
        }
        
        const indexPath = path.join(distPath, 'index.html');
        if (fs.existsSync(indexPath)) {
          res.sendFile(indexPath);
        } else {
          res.status(500).send('Application not built. Missing dist/index.html');
        }
      });

      app.use((error, req, res, next) => {
        console.error('🚨 Server Error:', error);
        res.status(500).json({ 
          error: 'Internal server error',
          message: process.env.NODE_ENV === 'development' ? error.message : 'Server error occurred'
        });
      });

      console.log('🗄️ Initializing database...');
      await setupDatabase();
      console.log('✅ Database initialized successfully');
      startProductionServer(app);
      
    } catch (fallbackError) {
      console.error('❌ Fallback also failed:', fallbackError);
      console.error('💥 Cannot start server in any mode');
      process.exit(1);
    }
  }
};

// Production server startup - FORCE PORT 443
const startProductionServer = (app) => {
  const PORT = 443;
  
  console.log('🚀 Starting AI-DU Agent Portal Production Server on PORT 443...');
  console.log(`📍 Environment: Production Offline Mode (Port ${PORT})`);
  
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
      
      server.on('error', (error) => {
        console.error('🚨 HTTPS Server Error:', error);
        if (error.code === 'EACCES') {
          console.error('❌ Permission denied. Run with sudo for port 443');
        } else if (error.code === 'EADDRINUSE') {
          console.error(`❌ Port ${PORT} is already in use`);
        }
        process.exit(1);
      });

      server.listen(PORT, '0.0.0.0', () => {
        console.log('✅ HTTPS Production Server Started Successfully!');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log(`🔒 HTTPS Server: Running on port ${PORT}`);
        console.log(`🌐 Production URL: https://aiduagent-csstip.ckit1.explab.com/`);
        console.log(`🔍 Health Check: https://aiduagent-csstip.ckit1.explab.com/api/health`);
        console.log(`🤖 NOVA API: https://aiduagent-csstip.ckit1.explab.com/api/nova/chat`);
        console.log(`💾 Static Files: ${path.join(__dirname, 'dist')}`);
        console.log(`🛡️ SSL Certificates: Loaded and Active`);
        console.log(`🗄️ Database: SQLite (shared_database.sqlite)`);
        console.log(`📡 API Routes: Fully Integrated`);
        console.log(`📦 Package: Offline-Ready with Fallback`);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('✨ Ready to accept connections from your domain!');
        console.log('🤖 NOVA is ready and available for chat!');
      });

    } catch (sslError) {
      console.error('❌ SSL Certificate Error:', sslError.message);
      console.error('🔧 Cannot start without SSL on port 443');
      process.exit(1);
    }
  } else {
    console.error('❌ SSL certificates required for port 443:');
    console.log(`   - Certificate: ${certPath} ${sslCertExists ? '✅' : '❌'}`);
    console.log(`   - Private Key: ${keyPath} ${sslKeyExists ? '✅' : '❌'}`);
    console.error('🔧 Cannot start HTTPS server on port 443 without SSL certificates');
    process.exit(1);
  }
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

process.on('uncaughtException', (error) => {
  console.error('🚨 UNCAUGHT EXCEPTION:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('🚨 UNHANDLED REJECTION at:', promise, 'reason:', reason);
  process.exit(1);
});

startServer();
