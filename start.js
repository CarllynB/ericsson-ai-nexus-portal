
import { spawn } from 'child_process';
import fs from 'fs';

const args = process.argv.slice(2);
const isDev = args.includes('--dev') || args.includes('-d');
const isProduction = args.includes('--prod') || args.includes('-p');

console.log('🚀 Starting AI-DU Agent Portal with HTTPS/SSL...\n');

// Check if SSL certificates exist
const sslCertExists = fs.existsSync('./aiduagent-csstip.ckit1.explab.com.crt');
const sslKeyExists = fs.existsSync('./aiduagent-csstip.ckit1.explab.com.key');

if (!sslCertExists || !sslKeyExists) {
  console.error('❌ SSL certificates not found!');
  console.error('Required files:');
  console.error('  - aiduagent-csstip.ckit1.explab.com.crt');
  console.error('  - aiduagent-csstip.ckit1.explab.com.key');
  process.exit(1);
}

if (isProduction) {
  console.log('🏭 Starting in Production Mode (HTTPS on port 443)...');
  
  // Check if dist folder exists, if not build first
  if (!fs.existsSync('./dist')) {
    console.log('📦 Building application for production...');
    
    const buildProcess = spawn('npm', ['run', 'build'], {
      stdio: 'inherit'
    });
    
    buildProcess.on('exit', (code) => {
      if (code === 0) {
        console.log('✅ Build completed successfully!');
        startProductionServer();
      } else {
        console.error('❌ Build failed with code:', code);
        process.exit(1);
      }
    });
  } else {
    console.log('📁 Using existing dist folder...');
    startProductionServer();
  }
} else {
  console.log('🔧 Starting in Development Mode (HTTPS on port 8080)...');
  startDevelopmentServer();
}

function startDevelopmentServer() {
  // Start the unified development server (Vite + Express backend integrated)
  const serverProcess = spawn('npx', ['tsx', './src/server/index.ts'], {
    stdio: 'inherit',
    env: {
      ...process.env,
      NODE_ENV: 'development',
      PORT: '8080'
    }
  });

  // Handle process cleanup
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

  serverProcess.on('exit', (code) => {
    if (code !== 0) {
      console.error(`❌ Development server exited with code ${code}`);
    }
  });

  console.log('✅ Development server started successfully!');
  console.log('🔒 HTTPS Frontend + Backend: https://localhost:8080');
  console.log('🔍 API Health: https://localhost:8080/api/health');
  console.log('💾 SQLite Database: shared_database.sqlite');
  console.log('\nPress Ctrl+C to stop the server\n');
}

function startProductionServer() {
  console.log('🚀 Starting production server...');
  
  // Start the production server
  const serverProcess = spawn('npx', ['tsx', './src/server/index.ts'], {
    stdio: 'inherit',
    env: {
      ...process.env,
      NODE_ENV: 'production',
      PORT: '443'
    }
  });

  // Handle process cleanup
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

  serverProcess.on('exit', (code) => {
    if (code !== 0) {
      console.error(`❌ Production server exited with code ${code}`);
    }
  });

  console.log('✅ Production server started successfully!');
  console.log('🔒 HTTPS Production Server: https://localhost:443');
  console.log('🔍 API Health: https://localhost:443/api/health');
  console.log('💾 SQLite Database: shared_database.sqlite');
  console.log('\nPress Ctrl+C to stop the server\n');
}
