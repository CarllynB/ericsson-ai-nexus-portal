
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

console.log('🚀 Starting AI-DU Agent Portal for Lab Production (Port 443)...\n');

// Check if SSL certificates exist
const sslCertExists = fs.existsSync('./aiduagent-csstip.ckit1.explab.com.crt');
const sslKeyExists = fs.existsSync('./aiduagent-csstip.ckit1.explab.com.key');

if (!sslCertExists || !sslKeyExists) {
  console.error('❌ SSL certificates not found! Required for lab URL access.');
  console.error('Missing files:');
  if (!sslCertExists) console.error('  - aiduagent-csstip.ckit1.explab.com.crt');
  if (!sslKeyExists) console.error('  - aiduagent-csstip.ckit1.explab.com.key');
  process.exit(1);
}

// Check if dist folder exists, if not build first
if (!fs.existsSync('./dist')) {
  console.log('📦 Building application for production...');
  
  const buildProcess = spawn('npm', ['run', 'build'], {
    stdio: 'inherit'
  });
  
  buildProcess.on('exit', (code) => {
    if (code === 0) {
      console.log('✅ Build completed successfully!');
      startLabProductionServer();
    } else {
      console.error('❌ Build failed with code:', code);
      process.exit(1);
    }
  });
} else {
  console.log('📁 Using existing dist folder...');
  startLabProductionServer();
}

function startLabProductionServer() {
  console.log('🚀 Starting lab production server on port 443...');
  console.log('⚠️  Note: You may need to run with sudo: sudo node start-lab-production.js');
  
  // Start the production server using tsx to handle TypeScript
  const serverProcess = spawn('npx', ['tsx', './src/server/index.ts'], {
    stdio: 'inherit',
    env: {
      ...process.env,
      NODE_ENV: 'production',
      PORT: '443',
      FORCE_HTTPS: 'true'
    }
  });

  // Handle process cleanup
  const cleanup = () => {
    console.log('\n🛑 Shutting down lab production server...');
    serverProcess.kill();
    process.exit();
  };

  process.on('SIGINT', cleanup);
  process.on('SIGTERM', cleanup);

  serverProcess.on('error', (err) => {
    console.error('❌ Lab production server error:', err);
    if (err.message.includes('EACCES') || err.message.includes('EADDRINUSE')) {
      console.error('💡 Try running with sudo: sudo node start-lab-production.js');
    }
  });

  serverProcess.on('exit', (code) => {
    if (code !== 0) {
      console.error(`❌ Lab production server exited with code ${code}`);
    }
  });

  console.log('✅ Lab production server started successfully!');
  console.log('🌐 Lab URL: https://aiduagent-csstip.ckit1.explab.com');
  console.log('🔒 Local HTTPS: https://localhost:443');
  console.log('🔍 API Health: https://aiduagent-csstip.ckit1.explab.com/api/health');
  console.log('💾 SQLite Database: shared_database.sqlite');
  console.log('\nPress Ctrl+C to stop the server\n');
}
