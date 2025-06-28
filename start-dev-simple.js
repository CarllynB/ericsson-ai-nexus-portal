
const { spawn } = require('child_process');

console.log('🚀 Starting AI-DU Agent Portal Development Server (HTTPS)...\n');

// Start the backend server on port 8081
console.log('🔧 Starting backend server on port 8081...');
const backendProcess = spawn('node', ['-r', 'ts-node/register', './src/server/index.ts'], {
  stdio: 'inherit',
  env: {
    ...process.env,
    NODE_ENV: 'development',
    PORT: '8081'
  }
});

// Wait a moment then start the frontend
setTimeout(() => {
  console.log('📱 Starting frontend dev server on port 8080 (HTTPS)...');
  const frontendProcess = spawn('npm', ['run', 'dev'], {
    stdio: 'inherit',
    env: {
      ...process.env,
    }
  });

  // Handle process cleanup
  const cleanup = () => {
    console.log('\n🛑 Shutting down servers...');
    backendProcess.kill();
    frontendProcess.kill();
    process.exit();
  };

  process.on('SIGINT', cleanup);
  process.on('SIGTERM', cleanup);

  frontendProcess.on('error', (err) => {
    console.error('❌ Frontend server error:', err);
  });

  frontendProcess.on('exit', (code) => {
    if (code !== 0) {
      console.error(`❌ Frontend server exited with code ${code}`);
    }
  });
}, 3000); // Increased delay to ensure backend starts properly

backendProcess.on('error', (err) => {
  console.error('❌ Backend server error:', err);
});

backendProcess.on('exit', (code) => {
  if (code !== 0) {
    console.error(`❌ Backend server exited with code ${code}`);
  }
});

console.log('✅ Backend server starting...');
console.log('🔒 Backend API: https://localhost:8081');
console.log('🔒 Frontend will start at: https://localhost:8080');
console.log('🔍 API Health: https://localhost:8081/api/health');
console.log('\nPress Ctrl+C to stop both servers\n');
