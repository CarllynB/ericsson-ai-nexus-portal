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

// Compile TypeScript server files first
const compileServerTypeScript = () => {
  return new Promise((resolve, reject) => {
    console.log('🔧 Compiling server TypeScript files...');
    
    // Check if source files exist
    const serverDir = path.join(__dirname, 'src', 'server');
    if (!fs.existsSync(serverDir)) {
      reject(new Error(`Server source directory not found: ${serverDir}`));
      return;
    }

    console.log('📁 Server source directory found:', serverDir);
    
    // Clean up any existing dist/server directory to avoid conflicts
    const distServerDir = path.join(__dirname, 'dist', 'server');
    if (fs.existsSync(distServerDir)) {
      console.log('🧹 Cleaning existing dist/server directory...');
      try {
        fs.rmSync(distServerDir, { recursive: true, force: true });
        console.log('✅ Cleaned dist/server directory');
      } catch (cleanError) {
        console.warn('⚠️ Could not clean dist/server directory:', cleanError.message);
      }
    }
    
    const tscProcess = spawn('npx', ['tsc', '--project', 'tsconfig.server.json'], {
      stdio: 'inherit'
    });

    tscProcess.on('close', (code) => {
      if (code === 0) {
        console.log('✅ Server TypeScript compilation successful');
        
        // Verify that the compiled files exist
        const expectedFiles = [
          './dist/server/database.js',
          './dist/server/routes/auth.js',
          './dist/server/routes/agents.js',
          './dist/server/routes/roles.js',
          './dist/server/routes/sidebar.js',
          './dist/server/routes/nova.js'
        ];
        
        const missingFiles = expectedFiles.filter(file => !fs.existsSync(file));
        if (missingFiles.length > 0) {
          console.error('❌ Expected compiled files not found:', missingFiles);
          reject(new Error(`Compiled files missing: ${missingFiles.join(', ')}`));
        } else {
          console.log('✅ All expected compiled files found');
          resolve();
        }
      } else {
        console.error('❌ Server TypeScript compilation failed');
        reject(new Error(`Server TypeScript compilation failed with code ${code}`));
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
    // Compile server TypeScript first
    await compileServerTypeScript();

    // Now dynamically import the compiled JavaScript modules
    const { setupDatabase } = await import('./dist/server/database.js');
    const { authRoutes } = await import('./dist/server/routes/auth.js');
    const { agentRoutes } = await import('./dist/server/routes/agents.js');
    const { roleRoutes } = await import('./dist/server/routes/roles.js');
    const { sidebarRoutes } = await import('./dist/server/routes/sidebar.js');
    const { novaRoutes } = await import('./dist/server/routes/nova.js');
    
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
    console.error('Stack trace:', error.stack);
    process.exit(1);
  }
};

// Production server startup - FORCE PORT 443
const startProductionServer = (app) => {
  const PORT = 443; // FORCE PORT 443 as requested
  
  console.log('🚀 Starting AI-DU Agent Portal Production Server on PORT 443...');
  console.log(`📍 Environment: Production Mode (Port ${PORT})`);
  
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
        console.log(`🤖 NOVA API: https://aiduagent-csstip.ckit1.explab.com/api/nova/chat`);
        console.log(`💾 Static Files: ${path.join(__dirname, 'dist')}`);
        console.log(`🛡️ SSL Certificates: Loaded and Active`);
        console.log(`🗄️ Database: SQLite (shared_database.sqlite)`);
        console.log(`📡 API Routes: Fully Integrated`);
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
