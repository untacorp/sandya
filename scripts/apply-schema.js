#!/usr/bin/env node

const fs = require('node:fs');
const path = require('node:path');
const { execSync } = require('node:child_process');

const SCHEMA_PATH = path.resolve(__dirname, '../src/infrastructure/db/supabase-postgres-schema.sql');

function main() {
  console.log('=== SANDYA DATABASE SCHEMA INITIALIZER ===');

  if (!fs.existsSync(SCHEMA_PATH)) {
  console.error(`Error: Schema file not found at ${SCHEMA_PATH}`);
  process.exit(1);
  }

  const dbUrl = process.env.DATABASE_URL || 'postgresql://sandya_admin:sandya_secret_password@localhost:5432/sandya_db';
  console.log(`Target Database: ${dbUrl.replace(/:[^:@]+@/, ':****@')}`);

  try {
  execSync('psql --version', { stdio: 'ignore' });
  console.log('Executing DDL schema via psql...');
  execSync(`psql "${dbUrl}" -f "${SCHEMA_PATH}"`, { stdio: 'inherit' });
  console.log('Schema migration applied successfully.');
  } catch (err) {
  console.log('\n[Catatan]: psql tidak ditemukan di PATH lokal atau koneksi langsung ditolak.');
  console.log('Untuk menjalankan schema secara manual:');
  console.log(`1. Gunakan psql: psql "<DATABASE_URL>" -f src/infrastructure/db/supabase-postgres-schema.sql`);
  console.log('2. Atau salin isi src/infrastructure/db/supabase-postgres-schema.sql ke SQL Editor di Supabase / pgAdmin / DBeaver.');
  }
}

main();
