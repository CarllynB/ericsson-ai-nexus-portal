
const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Starting AI-DU Agent Portal Development Server...\n');

// Start the backend server
const backendProcess = spawn('node', ['-r', 'ts-node/register', './src/server/index.ts'], {
  stdio: 'inherit',
  env: {
    ...process.env,
    NODE_ENV: 'development',
    PORT: '8080'
  }
});

// Start the frontend dev server
const frontendProcess = spawn('npm', ['run', 'dev'], {
  stdio: 'inherit',
  env: {
    ...process.env,
    VITE_API_URL: 'http://localhost:8080'
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

backendProcess.on('error', (err) => {
  console.error('❌ Backend server error:', err);
});

frontendProcess.on('error', (err) => {
  console.error('❌ Frontend server error:', err);
});

backendProcess.on('exit', (code) => {
  if (code !== 0) {
    console.error(`❌ Backend server exited with code ${code}`);
  }
});

frontendProcess.on('exit', (code) => {
  if (code !== 0) {
    console.error(`❌ Frontend server exited with code ${code}`);
  }
});

console.log('✅ Both servers started successfully!');
console.log('📱 Frontend: http://localhost:5173');
console.log('🔧 Backend: http://localhost:8080');
console.log('🔍 API Health: http://localhost:8080/api/health');
console.log('\nPress Ctrl+C to stop both servers\n');
