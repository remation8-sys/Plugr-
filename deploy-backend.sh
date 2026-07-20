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

echo "=== dev pieces (fork-modified core pieces) ==="
# The forms piece (Chat UI trigger + Respond on UI) and the ai piece (Run Agent,
# etc.) are both modified in this fork, so neither must be installed from the
# npm registry / worker package cache (that would fetch/keep upstream code).
# AP_DEV_PIECES makes the API serve their metadata from the local dist and the
# engine/worker load their code from packages/pieces/{core/forms,community/ai}/dist.
if ! grep -q '^AP_DEV_PIECES=' .env; then
  echo 'AP_DEV_PIECES=forms,ai' >> .env
  echo "added AP_DEV_PIECES=forms,ai to .env"
elif ! grep -q '^AP_DEV_PIECES=.*ai' .env; then
  sed -i.bak 's/^AP_DEV_PIECES=.*/AP_DEV_PIECES=forms,ai/' .env
  echo "updated AP_DEV_PIECES to include both forms,ai in .env"
fi

echo "=== load env ==="
set -a; . ./.env; set +a

echo "=== build engine + api + worker + dev pieces ==="
npx turbo run build --filter=@activepieces/engine --filter=api --filter=worker --filter=@activepieces/piece-forms --filter=@activepieces/piece-ai 2>&1 | tail -8

test -f dist/packages/engine/main.js                  || { echo "FATAL: engine build missing"; exit 1; }
test -f packages/server/api/dist/src/bootstrap.js     || { echo "FATAL: api build missing"; exit 1; }
test -f packages/server/worker/dist/src/bootstrap.js  || { echo "FATAL: worker build missing"; exit 1; }
test -f packages/pieces/core/forms/dist/src/index.js  || { echo "FATAL: forms piece build missing"; exit 1; }
test -f packages/pieces/core/forms/dist/package.json  || { echo "FATAL: forms piece dist package.json missing"; exit 1; }
test -f packages/pieces/community/ai/dist/src/index.js || { echo "FATAL: ai piece build missing"; exit 1; }
test -f packages/pieces/community/ai/dist/package.json || { echo "FATAL: ai piece dist package.json missing"; exit 1; }

echo "=== esbuild on PATH (Code steps) ==="
# The worker compiles Code steps by spawning a bare `esbuild`, which must be on
# PATH. node_modules/.bin is NOT on the PM2 worker's PATH, so expose esbuild in
# /usr/local/bin (same dir as bun). Symlink targets the .bin shim so it stays
# valid even when the @esbuild platform version changes on reinstall.
test -x node_modules/.bin/esbuild || { echo "FATAL: node_modules/.bin/esbuild missing"; exit 1; }
ln -sf "$(pwd)/node_modules/.bin/esbuild" /usr/local/bin/esbuild
esbuild --version

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