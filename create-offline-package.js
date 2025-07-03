#!/usr/bin/env node

// AI-DU Agent Portal - Create Offline Package Script
// This script creates the complete zero-download offline package

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

console.log('🚀 Creating AI-DU Agent Portal Zero-Download Offline Package...');
console.log('📦 This will create a complete self-contained package requiring only Node.js');

const runCommand = (command, args, options = {}) => {
  return new Promise((resolve, reject) => {
    console.log(`🔄 Running: ${command} ${args.join(' ')}`);
    const process = spawn(command, args, { stdio: 'inherit', ...options });
    
    process.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Command failed with code ${code}`));
      }
    });
    
    process.on('error', (error) => {
      reject(error);
    });
  });
};

const createOfflinePackage = async () => {
  try {
    // Step 1: Build the frontend
    console.log('🎨 Building frontend application...');
    await runCommand('npm', ['run', 'build']);
    console.log('✅ Frontend built successfully');

    // Step 2: Create offline package directories
    console.log('📁 Creating offline package structure...');
    const packageDir = 'offline-package';
    
    if (!fs.existsSync(packageDir)) {
      fs.mkdirSync(packageDir);
    }
    
    ['database', 'ssl', 'frontend'].forEach(dir => {
      const dirPath = path.join(packageDir, dir);
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
      }
    });

    // Step 3: Copy built frontend
    console.log('📋 Copying frontend files...');
    const distPath = 'dist';
    const frontendPath = path.join(packageDir, 'frontend');
    
    if (fs.existsSync(distPath)) {
      const copyRecursive = (src, dest) => {
        const stats = fs.statSync(src);
        if (stats.isDirectory()) {
          if (!fs.existsSync(dest)) {
            fs.mkdirSync(dest);
          }
          fs.readdirSync(src).forEach(childItem => {
            copyRecursive(path.join(src, childItem), path.join(dest, childItem));
          });
        } else {
          fs.copyFileSync(src, dest);
        }
      };
      
      copyRecursive(distPath, frontendPath);
      console.log('✅ Frontend files copied');
    } else {
      throw new Error('Frontend build not found. Run npm run build first.');
    }

    // Step 4: Copy database
    console.log('🗄️ Copying database...');
    const dbSource = 'shared_database.sqlite';
    const dbDest = path.join(packageDir, 'database', 'shared_database.sqlite');
    
    if (fs.existsSync(dbSource)) {
      fs.copyFileSync(dbSource, dbDest);
      console.log('✅ Database copied');
    } else {
      console.log('⚠️ Database file not found. You\'ll need to copy it manually to:', dbDest);
    }

    // Step 5: Copy SSL certificates
    console.log('🔐 Copying SSL certificates...');
    const certFiles = [
      'aiduagent-csstip.ckit1.explab.com.crt',
      'aiduagent-csstip.ckit1.explab.com.key'
    ];
    
    certFiles.forEach(certFile => {
      if (fs.existsSync(certFile)) {
        fs.copyFileSync(certFile, path.join(packageDir, 'ssl', certFile));
        console.log(`✅ ${certFile} copied`);
      } else {
        console.log(`⚠️ ${certFile} not found. You'll need to copy it manually.`);
      }
    });

    // Step 6: Install dependencies in package directory
    console.log('📦 Installing offline package dependencies...');
    await runCommand('npm', ['install', '--production'], { cwd: packageDir });
    console.log('✅ Dependencies installed');

    // Step 7: Create startup script
    console.log('📝 Creating startup script...');
    const startupScript = `#!/bin/bash

# AI-DU Agent Portal - Quick Start Script
echo "🚀 Starting AI-DU Agent Portal (Offline Package)..."
echo "📦 Zero-download version - requires only Node.js"
echo ""

# Check if Node.js is available
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

echo "✅ Node.js found: $(node --version)"
echo "🔄 Starting server..."
echo ""

node run-offline.js`;

    fs.writeFileSync(path.join(packageDir, 'start.sh'), startupScript);
    fs.chmodSync(path.join(packageDir, 'start.sh'), '755');
    console.log('✅ Startup script created');

    // Step 8: Create Windows batch file
    const windowsScript = `@echo off
echo 🚀 Starting AI-DU Agent Portal (Offline Package)...
echo 📦 Zero-download version - requires only Node.js
echo.

where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Node.js is not installed. Please install Node.js first.
    pause
    exit /b 1
)

echo ✅ Node.js found
echo 🔄 Starting server...
echo.

node run-offline.js
pause`;

    fs.writeFileSync(path.join(packageDir, 'start.bat'), windowsScript);
    console.log('✅ Windows startup script created');

    console.log('');
    console.log('🎉 OFFLINE PACKAGE CREATED SUCCESSFULLY!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`📁 Package location: ${path.resolve(packageDir)}`);
    console.log('');
    console.log('📋 What\'s included:');
    console.log('   ✅ Pure JavaScript server (no TypeScript compilation)');
    console.log('   ✅ Pre-built React frontend (no build process needed)');
    console.log('   ✅ SQLite database with your existing data');
    console.log('   ✅ SSL certificates for HTTPS');
    console.log('   ✅ All dependencies embedded');
    console.log('   ✅ Manual agent management only (no hardcoded agents)');
    console.log('   ❌ NOVA AI chat removed (as requested)');
    console.log('');
    console.log('🚀 To run the portal:');
    console.log(`   cd ${packageDir}`);
    console.log('   node run-offline.js');
    console.log('');
    console.log('🌐 Access at: https://aiduagent-csstip.ckit1.explab.com/');
    console.log('💻 Requirements: Only Node.js (no npm, no downloads, no compilation)');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  } catch (error) {
    console.error('❌ Error creating offline package:', error.message);
    process.exit(1);
  }
};

createOfflinePackage();