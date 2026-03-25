#!/usr/bin/env bash
set -euo pipefail

echo "⏹ Stopping PostgreSQL..."
docker compose down
echo "✅ Stopped."
