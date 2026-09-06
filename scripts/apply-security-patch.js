#!/usr/bin/env node

const fs = require('node:fs');
const path = require('node:path');
const { execSync } = require('node:child_process');

const PATCH_PATH = path.resolve(__dirname, '../src/infrastructure/db/supabase-security-hardening-patch.sql');

function main() {
  console.log('=== SANDYA SUPABASE SECURITY HARDENING PATCH APPLIER ===');

  if (!fs.existsSync(PATCH_PATH)) {
    console.error(`Error: Patch file not found at ${PATCH_PATH}`);
    process.exit(1);
  }

  const dbUrl = process.env.DATABASE_URL || 'postgresql://sandya_admin:sandya_secret_password@localhost:5432/sandya_db';
  console.log(`Target Database: ${dbUrl.replace(/:[^:@]+@/, ':****@')}`);

  try {
    execSync('psql --version', { stdio: 'ignore' });
    console.log('Applying security patch via psql...');
    execSync(`psql "${dbUrl}" -f "${PATCH_PATH}"`, { stdio: 'inherit' });
    console.log('Security patch applied successfully.');
  } catch (err) {
    console.log('\n[Catatan]: psql tidak ditemukan di PATH lokal atau koneksi langsung ditolak.');
    console.log('Untuk menjalankan patch secara manual pada Supabase yang sudah aktif:');
    console.log(`1. Gunakan psql: psql "<DATABASE_URL>" -f src/infrastructure/db/supabase-security-hardening-patch.sql`);
    console.log('2. Atau salin isi file src/infrastructure/db/supabase-security-hardening-patch.sql ke SQL Editor di Supabase Dashboard dan klik "Run".');
  }
}

main();
