import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const apiPath = path.join(rootDir, 'src', 'app', 'api');
const tempApiPath = path.join(rootDir, 'src', 'app', '_api_build_temp');

let movedApi = false;

try {
  // Move api folder temporarily if it exists so Next.js static export succeeds without dynamic route conflicts
  if (fs.existsSync(apiPath)) {
    fs.renameSync(apiPath, tempApiPath);
    movedApi = true;
    console.log('✓ Temporarily isolated src/app/api for static export');
  }

  console.log('⚡ Building Next.js static export for Tauri...');
  const nextBin = path.join(rootDir, 'node_modules', '.bin', process.platform === 'win32' ? 'next.cmd' : 'next');
  
  const result = spawnSync(nextBin, ['build'], {
    cwd: rootDir,
    stdio: 'inherit',
    env: {
      ...process.env,
      NODE_ENV: 'production',
      NEXT_EXPORT: 'true',
      TAURI_BUILD: 'true',
    },
  });

  if (result.status !== 0) {
    throw new Error(`Next.js build failed with exit code ${result.status}`);
  }

  const outDir = path.join(rootDir, 'out');
  if (!fs.existsSync(outDir)) {
    throw new Error(`Expected static export directory "${outDir}" was not created!`);
  }

  console.log('✓ Tauri static frontend export completed successfully in "out/"');
} finally {
  if (movedApi && fs.existsSync(tempApiPath)) {
    fs.renameSync(tempApiPath, apiPath);
    console.log('✓ Restored src/app/api');
  }
}
