#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');

console.log('🌿 Cannabis Management System - Starting Application...\n');

// Function to run a command
function runCommand(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: 'inherit',
      shell: true,
      ...options
    });

    child.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`Command failed with exit code ${code}`));
      } else {
        resolve();
      }
    });

    child.on('error', (error) => {
      reject(error);
    });
  });
}

async function main() {
  try {
    console.log('📦 Installing dependencies...');
    
    // Install backend dependencies
    console.log('Installing backend dependencies...');
    await runCommand('npm', ['install']);
    
    // Install frontend dependencies
    console.log('Installing frontend dependencies...');
    await runCommand('npm', ['install'], { cwd: path.join(__dirname, 'client') });
    
    console.log('\n✅ Dependencies installed successfully!');
    console.log('\n🚀 Starting development servers...');
    console.log('Backend will run on: http://localhost:3001');
    console.log('Frontend will run on: http://localhost:3000');
    console.log('\nPress Ctrl+C to stop both servers\n');
    
    // Start both servers concurrently
    await runCommand('npm', ['run', 'dev']);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.log('\n📋 Manual setup instructions:');
    console.log('1. npm install');
    console.log('2. cd client && npm install');
    console.log('3. Create PostgreSQL database: cannabis_management');
    console.log('4. Copy .env.example to .env and configure database');
    console.log('5. npm run db:migrate');
    console.log('6. npm run dev');
    process.exit(1);
  }
}

main();