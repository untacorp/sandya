#!/usr/bin/env bash
set -e

# Sandya - PostgreSQL Initializer Script
# Usage: ./scripts/init-postgres.sh [DATABASE_URL]

SCHEMA_FILE="src/infrastructure/db/supabase-postgres-schema.sql"
TARGET_URL="${1:-${DATABASE_URL:-postgresql://sandya_admin:sandya_secret_password@localhost:5432/sandya_db}}"

echo "========================================================"
echo " SANDYA - POSTGRESQL SCHEMA MIGRATION"
echo "========================================================"
echo "Target: ${TARGET_URL}"
echo "Schema: ${SCHEMA_FILE}"
echo "--------------------------------------------------------"

if [ ! -f "$SCHEMA_FILE" ]; then
  echo "Error: File $SCHEMA_FILE tidak ditemukan!"
  exit 1
fi

if command -v psql &> /dev/null; then
  echo "Menjalankan DDL schema melalui psql..."
  psql "$TARGET_URL" -f "$SCHEMA_FILE"
  echo "Inisialisasi schema database PostgreSQL berhasil selesai."
else
  echo "psql tidak terpasang di sistem. Silakan eksekusi manual via GUI / Supabase SQL Editor."
fi
