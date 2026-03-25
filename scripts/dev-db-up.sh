#!/usr/bin/env bash
set -euo pipefail

echo "🚀 Starting local DB (PostgreSQL)..."
docker compose up -d postgres

echo -n "⏳ Waiting for Postgres "
ATTEMPTS=0
until docker compose exec postgres pg_isready -U postgres -d workflow101 > /dev/null 2>&1; do
  ATTEMPTS=$((ATTEMPTS+1))
  if [ $ATTEMPTS -gt 60 ]; then
    echo
    echo "❌ Postgres did not become ready in time."
    exit 1
  fi
  printf "."
  sleep 2
done
echo " ✅"

echo "✅ PostgreSQL is ready."
echo ""
echo "Environment variables set:"
echo "  POSTGRES_URL_NON_POOLING=postgresql://postgres:postgres@localhost:5432/workflow101"
echo "  DATABASE_URL=postgresql://postgres:postgres@localhost:5432/workflow101"
echo ""
echo "Run 'npm run dev' to start the development server."
