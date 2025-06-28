
const { spawn } = require('child_process');

console.log('🚀 Starting AI-DU Agent Portal All-in-One Server...\n');

// Start the unified development server
const process = spawn('node', ['dev-server.js'], {
  stdio: 'inherit'
});

process.on('error', (err) => {
  console.error('❌ Failed to start server:', err);
});

process.on('exit', (code) => {
  console.log(`Server process exited with code: ${code}`);
});
