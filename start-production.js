
const { spawn } = require('child_process');
const fs = require('fs');

console.log('🚀 Starting AI-DU Agent Portal Production Server...\n');

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

function startProductionServer() {
  console.log('🚀 Starting production server with full backend...');
  
  // Start the production server using the full backend
  const serverProcess = spawn('node', ['-r', 'ts-node/register', './src/server/index.ts'], {
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
  console.log('🌐 HTTPS URL: https://aiduagent-csstip.ckit1.explab.com');
  console.log('🔒 Local HTTPS: https://localhost:443');
  console.log('🔍 API Health: https://aiduagent-csstip.ckit1.explab.com/api/health');
  console.log('💾 SQLite Database: shared_database.sqlite');
  console.log('\nPress Ctrl+C to stop the server\n');
}
