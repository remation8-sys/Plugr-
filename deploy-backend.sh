#!/usr/bin/env bash
# Plugr BACKEND deploy.
# Pulls latest code, builds engine + API + WORKER, and restarts BOTH PM2
# processes (plugr-api AND plugr-worker). The worker is what runs flow steps
# and resolves dynamic fields (/pieces/options) — without it the flow builder
# hangs with 504s.
#
# deploy.sh  -> updates the FRONTEND (website) only.
# this file  -> updates the BACKEND (api + worker + engine).
#
# Causes a few seconds of API downtime while it restarts. Safe to re-run.
set -euo pipefail

export PATH="/usr/local/bin:/root/.bun/bin:$PATH"
cd /var/www/plugr

echo "=== bun check ==="
command -v bun >/dev/null || { echo "FATAL: bun not installed (expected at /usr/local/bin/bun)"; exit 1; }
bun --version

echo "=== fetch + reset to origin/phase-1-rebrand ==="
git fetch origin phase-1-rebrand --depth 1 2>&1 | tail -1
git reset --hard origin/phase-1-rebrand 2>&1 | tail -1
echo "commit: $(git rev-parse --short HEAD)"

echo "=== load env ==="
set -a; . ./.env; set +a

echo "=== build engine + api + worker ==="
npx turbo run build --filter=@activepieces/engine --filter=api --filter=worker 2>&1 | tail -8

test -f dist/packages/engine/main.js                  || { echo "FATAL: engine build missing"; exit 1; }
test -f packages/server/api/dist/src/bootstrap.js     || { echo "FATAL: api build missing"; exit 1; }
test -f packages/server/worker/dist/src/bootstrap.js  || { echo "FATAL: worker build missing"; exit 1; }

echo "=== worker token + container type ==="
# WORKER_AND_APP keeps the worker from binding its health server to port 3000
# (the API already owns 3000). The token is a JWT signed with AP_JWT_SECRET.
export AP_CONTAINER_TYPE=WORKER_AND_APP
export AP_WORKER_TOKEN="$(node -e 'const jwt=require("jsonwebtoken"),crypto=require("crypto");const s=process.env.AP_JWT_SECRET;if(!s){console.error("AP_JWT_SECRET missing");process.exit(1)}process.stdout.write(jwt.sign({id:crypto.randomUUID(),type:"WORKER"},s,{expiresIn:"100y",keyid:"1",algorithm:"HS256",issuer:"activepieces"}))')"
[ -n "${AP_WORKER_TOKEN:-}" ] || { echo "FATAL: could not generate worker token"; exit 1; }

echo "=== restart API ==="
if pm2 describe plugr-api >/dev/null 2>&1; then
  pm2 restart plugr-api --update-env
else
  pm2 start packages/server/api/dist/src/bootstrap.js --name plugr-api --time --update-env
fi

echo "=== restart WORKER ==="
if pm2 describe plugr-worker >/dev/null 2>&1; then
  pm2 restart plugr-worker --update-env
else
  pm2 start packages/server/worker/dist/src/bootstrap.js --name plugr-worker --time --update-env
fi

pm2 save
pm2 list
echo "BACKEND_DEPLOY_OK"