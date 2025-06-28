
const { spawn } = require('child_process');
const path = require('path');

// Function to start a process and pipe its output
function startProcess(command, args, name, color) {
  const process = spawn(command, args, {
    stdio: 'pipe',
    shell: true,
    cwd: __dirname
  });

  // Color codes for terminal output
  const colors = {
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    reset: '\x1b[0m'
  };

  const colorCode = colors[color] || colors.reset;

  process.stdout.on('data', (data) => {
    console.log(`${colorCode}[${name}]${colors.reset} ${data.toString().trim()}`);
  });

  process.stderr.on('data', (data) => {
    console.log(`${colorCode}[${name}]${colors.reset} ${data.toString().trim()}`);
  });

  process.on('close', (code) => {
    console.log(`${colorCode}[${name}]${colors.reset} Process exited with code ${code}`);
  });

  return process;
}

console.log('🚀 Starting AI-DU Agent Portal...');
console.log('📁 Backend will use SQLite database: shared_database.sqlite');
console.log('🔒 HTTPS certificates will be used if available');
console.log('');

// Start backend server on port 3001
const backend = startProcess(
  'node',
  ['-r', 'ts-node/register', 'src/server/index.ts'],
  'Backend',
  'green'
);

// Wait a moment for backend to start, then start frontend
setTimeout(() => {
  const frontend = startProcess(
    'npm',
    ['run', 'dev'],
    'Frontend',
    'blue'
  );

  // Handle cleanup on exit
  process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down servers...');
    backend.kill('SIGTERM');
    frontend.kill('SIGTERM');
    process.exit(0);
  });

  process.on('SIGTERM', () => {
    backend.kill('SIGTERM');
    frontend.kill('SIGTERM');
    process.exit(0);
  });
}, 2000);
