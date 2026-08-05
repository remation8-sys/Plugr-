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

echo "=== dev pieces (fork-modified pieces) ==="
# The forms piece (Chat UI trigger + Respond on UI), the ai piece (Run Agent,
# etc.), and the gmail piece (New Email / New Labeled Email now expose the real
# Gmail message id) are all modified in this fork, so none must be installed
# from the npm registry / worker package cache (that would fetch/keep upstream
# code). AP_DEV_PIECES makes the API serve their metadata from the local dist
# and the engine/worker load their code from packages/pieces/{.../<name>}/dist.
#
# sendgrid, zendesk, mailchimp, xero, openai, quickbooks, intercom,
# azure-openai, letmepost, and produktly were added the same way (aiMetadata
# additions, new actions, or brand-new pieces cherry-picked from upstream) -
# without this they'd keep resolving from the public npm registry and none of
# that work would actually run.
#
# tables carries a real fork bug fix (find-records defaulted to an effectively
# unbounded limit, 999999999, instead of 1000) that sat inert in git for days
# because this piece was never added here either - caught via an audit of
# every fork commit touching packages/pieces/ after the sendgrid/etc. rollout
# surfaced the general risk.
#
# IMPORTANT: dev-piece code loads by NAME, not by version - never bump a dev
# piece's package.json version without also updating every existing flow that
# pins the old version, or those flows fail their exact-version piece lookup
# and get auto-disabled (see provisionFlowPieces -> pieceCache.getPiece ->
# fetchPieceVersion in piece-metadata-service.ts). openai stayed pinned at
# 0.9.1 (one disabled draft flow) and tables at 0.3.2 (6 live enabled flows)
# for exactly this reason.
DEV_PIECES="forms,ai,gmail,sendgrid,zendesk,mailchimp,xero,openai,quickbooks,intercom,azure-openai,letmepost,produktly,tables"
if ! grep -q '^AP_DEV_PIECES=' .env; then
  echo "AP_DEV_PIECES=$DEV_PIECES" >> .env
  echo "added AP_DEV_PIECES=$DEV_PIECES to .env"
elif ! grep -q "^AP_DEV_PIECES=$DEV_PIECES$" .env; then
  sed -i.bak "s/^AP_DEV_PIECES=.*/AP_DEV_PIECES=$DEV_PIECES/" .env
  echo "updated AP_DEV_PIECES to $DEV_PIECES in .env"
fi

echo "=== load env ==="
set -a; . ./.env; set +a

echo "=== install deps ==="
bun install 2>&1 | tail -10

echo "=== build engine + api + worker + dev pieces ==="
npx turbo run build --filter=@activepieces/engine --filter=api --filter=worker \
  --filter=@activepieces/piece-forms --filter=@activepieces/piece-ai --filter=@activepieces/piece-gmail \
  --filter=@activepieces/piece-sendgrid --filter=@activepieces/piece-zendesk --filter=@activepieces/piece-mailchimp \
  --filter=@activepieces/piece-xero --filter=@activepieces/piece-openai --filter=@activepieces/piece-quickbooks \
  --filter=@activepieces/piece-intercom --filter=@activepieces/piece-azure-openai --filter=@activepieces/piece-letmepost \
  --filter=@activepieces/piece-produktly --filter=@activepieces/piece-tables 2>&1 | tail -8

test -f dist/packages/engine/main.js                  || { echo "FATAL: engine build missing"; exit 1; }
test -f packages/server/api/dist/src/bootstrap.js     || { echo "FATAL: api build missing"; exit 1; }
test -f packages/server/worker/dist/src/bootstrap.js  || { echo "FATAL: worker build missing"; exit 1; }
for p in core/forms:forms community/ai:ai community/gmail:gmail community/sendgrid:sendgrid community/zendesk:zendesk community/mailchimp:mailchimp community/xero:xero community/openai:openai community/quickbooks:quickbooks community/intercom:intercom community/azure-openai:azure-openai community/letmepost:letmepost community/produktly:produktly core/tables:tables; do
  dir="${p%%:*}"; label="${p##*:}"
  test -f "packages/pieces/$dir/dist/src/index.js" || { echo "FATAL: $label piece build missing"; exit 1; }
  test -f "packages/pieces/$dir/dist/package.json" || { echo "FATAL: $label piece dist package.json missing"; exit 1; }
done

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