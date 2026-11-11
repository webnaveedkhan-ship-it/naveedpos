const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔧 [NaveedPOS Build]: Detecting deployment environment...');

// Check if we are running at the monorepo root
if (fs.existsSync(path.join(__dirname, '../client/package.json'))) {
  console.log('📦 [Monorepo Mode]: Building client from monorepo root...');
  
  // 1. Install client dependencies
  console.log('📥 Installing client dependencies...');
  execSync('npm --prefix client install', { stdio: 'inherit' });

  // 2. Build Vite bundle
  console.log('⚡ Compiling Vite production bundle...');
  execSync('npm --prefix client run build', { stdio: 'inherit' });

  // 3. Mirror dist to root dist for maximum compatibility with all hosting providers
  const clientDist = path.join(__dirname, '../client/dist');
  const rootDist = path.join(__dirname, '../dist');
  if (fs.existsSync(clientDist)) {
    console.log('📂 Mirroring client/dist to root dist folder...');
    fs.cpSync(clientDist, rootDist, { recursive: true });
  }

  console.log('✅ [Build Complete]: Production bundle ready.');
} else if (fs.existsSync(path.join(__dirname, '../package.json'))) {
  // Standalone client deployment (Root Directory = client in Vercel)
  console.log('⚡ [Client Subdirectory Mode]: Building directly via Vite...');
  execSync('npm run build', { stdio: 'inherit' });
  console.log('✅ [Build Complete]: Production bundle ready in dist.');
} else {
  console.error('❌ Could not locate package.json for build.');
  process.exit(1);
}
