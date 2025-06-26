
#!/usr/bin/env node

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
const mode = args[0] || 'dev';

// Check if SSL certificates exist
const certPath = './aiduagent-csstip.ckit1.explab.com.crt';
const keyPath = './aiduagent-csstip.ckit1.explab.com.key';
const sslCertExists = fs.existsSync(certPath);
const sslKeyExists = fs.existsSync(keyPath);

console.log('\n🚀 AI-DU Agent Portal Startup\n');

if (mode === 'dev' || mode === 'development') {
  console.log('Starting in development mode...');
  
  if (sslCertExists && sslKeyExists) {
    console.log('✅ SSL certificates found - starting with HTTPS on port 443');
    console.log('⚠️  You may need to run with sudo: sudo npm run start:dev');
    console.log('🌐 Access your app at: https://aiduagent-csstip.ckit1.explab.com/\n');
  } else {
    console.log('⚠️  SSL certificates not found - starting with HTTP on port 8080');
    console.log('🌐 Access your app at: http://localhost:8080/\n');
  }
  
  const viteProcess = spawn('npm', ['run', 'dev'], {
    stdio: 'inherit',
    shell: true
  });
  
  viteProcess.on('error', (error) => {
    console.error('Error starting development server:', error);
  });
  
} else if (mode === 'prod' || mode === 'production') {
  console.log('Starting in production mode...');
  
  // Check if build exists
  if (!fs.existsSync('./dist')) {
    console.log('📦 Building application...');
    const buildProcess = spawn('npm', ['run', 'build'], {
      stdio: 'inherit',
      shell: true
    });
    
    buildProcess.on('close', (code) => {
      if (code === 0) {
        startProductionServer();
      } else {
        console.error('Build failed with code:', code);
        process.exit(1);
      }
    });
  } else {
    startProductionServer();
  }
  
} else {
  console.log('Usage: node start.js [dev|prod]');
  console.log('  dev  - Start development server');
  console.log('  prod - Build and start production server');
}

function startProductionServer() {
  if (sslCertExists && sslKeyExists) {
    console.log('🔒 Starting HTTPS production server on port 443');
    console.log('⚠️  You may need to run with sudo: sudo npm run start:prod');
    console.log('🌐 Access your app at: https://aiduagent-csstip.ckit1.explab.com/\n');
  } else {
    console.log('⚠️  SSL certificates not found - please add certificates for HTTPS');
    console.log('🌐 Server will start on HTTPS port 443 but may not work without certificates\n');
  }
  
  const serverProcess = spawn('node', ['server.js'], {
    stdio: 'inherit'
  });
  
  serverProcess.on('error', (error) => {
    console.error('Error starting production server:', error);
  });
}
