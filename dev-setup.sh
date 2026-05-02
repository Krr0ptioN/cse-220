#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT_DIR"

if ! command -v npm >/dev/null 2>&1; then
  echo "Error: npm is required but was not found in PATH."
  exit 1
fi

if ! command -v poetry >/dev/null 2>&1; then
  echo "Error: poetry is required but was not found in PATH."
  exit 1
fi

export POETRY_KEYRING_ENABLED=false

if [[ -x "./nx" ]]; then
  NX_CMD=("./nx")
else
  NX_CMD=("npx" "nx")
fi

echo "[1/5] Installing Node dependencies..."
npm install

echo "[2/5] Installing api-http Python dependencies..."
"${NX_CMD[@]}" run api-http:install

echo "[3/5] Running api-http tests..."
"${NX_CMD[@]}" run api-http:test

echo "[4/5] Installing API Python dependencies..."
"${NX_CMD[@]}" run api:install

echo "[5/5] Applying API migrations..."
"${NX_CMD[@]}" run api:migrate

echo
echo "Setup completed successfully."
echo "Start API server: ${NX_CMD[*]} run api:runserver"
