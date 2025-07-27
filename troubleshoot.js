#!/usr/bin/env node

// Troubleshooting script for Seana Bot deployment issues
const fs = require('fs');
const path = require('path');

console.log('🔧 Seana Bot Troubleshooting Tool');
console.log('==================================\n');

// Check Node.js version
console.log('📋 System Check:');
console.log(`   Node.js version: ${process.version}`);
console.log(`   Platform: ${process.platform}`);
console.log(`   Architecture: ${process.arch}\n`);

// Check if Node.js version meets requirements
const nodeVersion = parseInt(process.version.slice(1).split('.')[0]);
if (nodeVersion < 20) {
    console.log('❌ Node.js version check FAILED');
    console.log('   @whiskeysockets/baileys requires Node.js 20+');
    console.log(`   Current version: ${process.version}`);
    console.log('   Please upgrade to Node.js 20+\n');
} else {
    console.log('✅ Node.js version check PASSED\n');
}

// Check package.json
console.log('📦 Package Check:');
try {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    
    // Check engines field
    if (packageJson.engines && packageJson.engines.node) {
        console.log(`   Engines.node: ${packageJson.engines.node}`);
    } else {
        console.log('   ⚠️  No engines.node field found in package.json');
    }
    
    // Check baileys version
    if (packageJson.dependencies && packageJson.dependencies['@whiskeysockets/baileys']) {
        console.log(`   Baileys version: ${packageJson.dependencies['@whiskeysockets/baileys']}`);
    }
    
    console.log('✅ package.json check PASSED\n');
} catch (error) {
    console.log('❌ package.json check FAILED');
    console.log(`   Error: ${error.message}\n`);
}

// Check required files
console.log('📁 File Check:');
const requiredFiles = [
    'index.js',
    'server.js',
    'config/config.js',
    'database/connection.js',
    'Dockerfile',
    'railway.json',
    '.dockerignore'
];

const missingFiles = [];
requiredFiles.forEach(file => {
    if (fs.existsSync(file)) {
        console.log(`   ✅ ${file}`);
    } else {
        console.log(`   ❌ ${file} - MISSING`);
        missingFiles.push(file);
    }
});

if (missingFiles.length > 0) {
    console.log(`\n   ⚠️  Missing ${missingFiles.length} required files`);
}
console.log();

// Check Dockerfile
console.log('🐳 Dockerfile Check:');
try {
    const dockerfile = fs.readFileSync('Dockerfile', 'utf8');
    
    if (dockerfile.includes('node:20')) {
        console.log('   ✅ Using Node.js 20');
    } else if (dockerfile.includes('node:18')) {
        console.log('   ❌ Using Node.js 18 - needs upgrade to 20');
    } else {
        console.log('   ⚠️  Node.js version not clearly specified');
    }
    
    if (dockerfile.includes('npm ci --omit=dev')) {
        console.log('   ✅ Using correct npm install command');
    } else if (dockerfile.includes('npm ci --only=production')) {
        console.log('   ⚠️  Using deprecated --only=production flag');
    }
    
    console.log();
} catch (error) {
    console.log('   ❌ Cannot read Dockerfile');
    console.log(`   Error: ${error.message}\n`);
}

// Check environment variables
console.log('🔐 Environment Variables Check:');
const requiredEnvVars = ['NODE_ENV', 'PORT', 'MONGODB_URI'];
const missingEnvVars = [];

requiredEnvVars.forEach(envVar => {
    if (process.env[envVar]) {
        console.log(`   ✅ ${envVar}`);
    } else {
        console.log(`   ❌ ${envVar} - MISSING`);
        missingEnvVars.push(envVar);
    }
});

if (missingEnvVars.length > 0) {
    console.log(`\n   ⚠️  Missing ${missingEnvVars.length} environment variables`);
    console.log('   Create .env file or set in Railway dashboard');
}
console.log();

// Check MongoDB connection
console.log('🍃 MongoDB Connection Check:');
if (process.env.MONGODB_URI) {
    if (process.env.MONGODB_URI.startsWith('mongodb://') || process.env.MONGODB_URI.startsWith('mongodb+srv://')) {
        console.log('   ✅ MongoDB URI format looks correct');
    } else {
        console.log('   ❌ MongoDB URI format looks incorrect');
    }
} else {
    console.log('   ❌ MONGODB_URI not set');
}
console.log();

// Summary and recommendations
console.log('📊 Summary & Recommendations:');
console.log('==============================');

if (nodeVersion < 20) {
    console.log('🔴 CRITICAL: Upgrade to Node.js 20+');
    console.log('   - Update Dockerfile to use node:20-alpine');
    console.log('   - Set NODE_VERSION=20 in Railway environment variables');
}

if (missingFiles.length > 0) {
    console.log('🟡 WARNING: Missing required files');
    console.log('   - Ensure all files are committed to repository');
}

if (missingEnvVars.length > 0) {
    console.log('🟡 WARNING: Missing environment variables');
    console.log('   - Set in Railway dashboard or .env file');
}

console.log('\n🚀 Deployment Commands:');
console.log('   railway login');
console.log('   railway init');
console.log('   railway up');
console.log('\n📖 For detailed help, see DEPLOYMENT.md');