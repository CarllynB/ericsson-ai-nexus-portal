
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const isDev = process.argv.includes('--dev') || process.env.NODE_ENV === 'development';
const isProduction = process.argv.includes('--prod') || process.env.NODE_ENV === 'production';

console.log(`🚀 Starting AI-DU Agent Portal ${isDev ? 'Development' : 'Production'} Server (HTTPS)...\n`);

// Check for SSL certificates
const sslCertExists = fs.existsSync('./aiduagent-csstip.ckit1.explab.com.crt');
const sslKeyExists = fs.existsSync('./aiduagent-csstip.ckit1.explab.com.key');

if (!sslCertExists || !sslKeyExists) {
  console.error('❌ SSL certificates not found!');
  console.error('Required files:');
  console.error('  - aiduagent-csstip.ckit1.explab.com.crt');
  console.error('  - aiduagent-csstip.ckit1.explab.com.key');
  process.exit(1);
}

if (isDev) {
  console.log('🔧 Starting development server with HTTPS...');
  
  // Start the unified development server
  const serverProcess = spawn('npx', ['tsx', './src/server/index.ts'], {
    stdio: 'inherit',
    env: {
      ...process.env,
      NODE_ENV: 'development',
      PORT: '8080'
    }
  });

  // Handle cleanup
  const cleanup = () => {
    console.log('\n🛑 Shutting down development server...');
    serverProcess.kill();
    process.exit();
  };

  process.on('SIGINT', cleanup);
  process.on('SIGTERM', cleanup);

  serverProcess.on('error', (err) => {
    console.error('❌ Development server error:', err);
  });

  console.log('✅ Development server started!');
  console.log('🔒 HTTPS Frontend + Backend: https://localhost:8080');
  console.log('🔍 API Health: https://localhost:8080/api/health');
  
} else {
  console.log('🏭 Starting production server...');
  
  // Check if dist exists, build if needed
  if (!fs.existsSync('./dist')) {
    console.log('📦 Building application for production...');
    
    const buildProcess = spawn('npm', ['run', 'build'], {
      stdio: 'inherit'
    });
    
    buildProcess.on('exit', (code) => {
      if (code === 0) {
        console.log('✅ Build completed!');
        startProductionServer();
      } else {
        console.error('❌ Build failed with code:', code);
        process.exit(1);
      }
    });
  } else {
    startProductionServer();
  }
}

function startProductionServer() {
  // Start the production server
  const serverProcess = spawn('node', ['-r', 'ts-node/register', './src/server/index.ts'], {
    stdio: 'inherit',
    env: {
      ...process.env,
      NODE_ENV: 'production',
      PORT: '443'
    }
  });

  const cleanup = () => {
    console.log('\n🛑 Shutting down production server...');
    serverProcess.kill();
    process.exit();
  };

  process.on('SIGINT', cleanup);
  process.on('SIGTERM', cleanup);

  serverProcess.on('error', (err) => {
    console.error('❌ Production server error:', err);
  });

  console.log('✅ Production server started!');
  console.log('🔒 HTTPS Production Server: https://localhost:443');
  console.log('🔍 API Health: https://localhost:443/api/health');
}

console.log('💾 SQLite Database: shared_database.sqlite');
console.log('\nPress Ctrl+C to stop the server\n');
