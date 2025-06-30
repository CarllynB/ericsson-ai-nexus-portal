
import { spawn } from 'child_process';

console.log('🚀 Starting AI-DU Agent Portal Development Server (HTTPS)...\n');

// Start the unified development server
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

console.log('✅ Development server starting...');
console.log('🔒 HTTPS Frontend + Backend: https://localhost:8080');
console.log('🔍 API Health: https://localhost:8080/api/health');
console.log('💾 SQLite Database: shared_database.sqlite');
console.log('\nPress Ctrl+C to stop the server\n');
