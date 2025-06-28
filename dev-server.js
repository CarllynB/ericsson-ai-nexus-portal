
import { spawn } from 'child_process';
import path from 'path';

console.log('🚀 Starting AI-DU Agent Portal All-in-One Server...\n');

// Start the unified server (Vite + Express backend integrated)
const serverProcess = spawn('npm', ['run', 'dev'], {
  stdio: 'inherit',
  env: {
    ...process.env,
    NODE_ENV: 'development',
    VITE_API_URL: 'http://localhost:8080'
  }
});

// Handle process cleanup
const cleanup = () => {
  console.log('\n🛑 Shutting down server...');
  serverProcess.kill();
  process.exit();
};

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);

serverProcess.on('error', (err) => {
  console.error('❌ Server error:', err);
});

serverProcess.on('exit', (code) => {
  if (code !== 0) {
    console.error(`❌ Server exited with code ${code}`);
  }
});

console.log('✅ All-in-One server started successfully!');
console.log('🌐 Frontend + Backend + Database: http://localhost:8080');
console.log('🔍 API Health: http://localhost:8080/api/health');
console.log('💾 SQLite Database: shared_database.sqlite');
console.log('\nPress Ctrl+C to stop the server\n');
