#!/usr/bin/env node

// Simple test script to verify the setup
console.log('🧪 Testing Dealer Management System Setup...\n');

// Test 1: Check if all required files exist
import fs from 'fs';
import path from 'path';

const requiredFiles = [
  'package.json',
  'tsconfig.json',
  'tsconfig.server.json',
  'vite.config.ts',
  'src/server/index.ts',
  'src/server/config/database.ts',
  'src/server/config/config.ts',
  'src/server/models/Contract.ts',
  'src/server/routes/contracts.ts',
  'src/client/App.tsx',
  'src/client/main.tsx'
];

console.log('📁 Checking required files...');
let allFilesExist = true;

requiredFiles.forEach(file => {
  const exists = fs.existsSync(file);
  console.log(`  ${exists ? '✅' : '❌'} ${file}`);
  if (!exists) allFilesExist = false;
});

console.log('');

// Test 2: Check package.json scripts
console.log('📦 Checking package.json scripts...');
try {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const requiredScripts = ['dev', 'dev:server', 'dev:client', 'build', 'start'];
  
  requiredScripts.forEach(script => {
    const exists = packageJson.scripts && packageJson.scripts[script];
    console.log(`  ${exists ? '✅' : '❌'} ${script}`);
  });
} catch (error) {
  console.log('  ❌ Failed to read package.json');
}

console.log('');

// Test 3: Check dependencies
console.log('🔧 Checking dependencies...');
try {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const requiredDeps = ['express', 'react', 'typescript', 'vite'];
  
  requiredDeps.forEach(dep => {
    const exists = packageJson.dependencies && packageJson.dependencies[dep];
    console.log(`  ${exists ? '✅' : '❌'} ${dep}`);
  });
} catch (error) {
  console.log('  ❌ Failed to read package.json dependencies');
}

console.log('');

// Test 4: Check TypeScript configuration
console.log('⚙️  Checking TypeScript configuration...');
try {
  const tsConfig = JSON.parse(fs.readFileSync('tsconfig.json', 'utf8'));
  const hasServerRef = tsConfig.references && tsConfig.references.length > 0;
  console.log(`  ${hasServerRef ? '✅' : '❌'} Server TypeScript config reference`);
  
  const tsServerConfig = JSON.parse(fs.readFileSync('tsconfig.server.json', 'utf8'));
  const hasOutDir = tsServerConfig.compilerOptions && tsServerConfig.compilerOptions.outDir;
  console.log(`  ${hasOutDir ? '✅' : '❌'} Server outDir configuration`);
} catch (error) {
  console.log('  ❌ Failed to read TypeScript configuration');
}

console.log('');

// Summary
if (allFilesExist) {
  console.log('🎉 Setup looks good! You can now run:');
  console.log('  npm run dev          # Start both backend and frontend');
  console.log('  npm run dev:server   # Start backend only');
  console.log('  npm run dev:client   # Start frontend only');
  console.log('  npm run build        # Build for production');
  console.log('  npm start            # Start production server');
} else {
  console.log('⚠️  Some files are missing. Please check the setup.');
}

console.log('\n📚 See README.md for detailed setup instructions.');
