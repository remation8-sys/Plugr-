# Plugr production delivery

`nginx-site.conf` is the production site configuration for `plugr.cloud`. It
keeps API and WebSocket proxying unchanged while enabling HTTP/2, compression,
immutable caching for hashed Vite assets, and no-cache handling for the PWA
service worker and HTML shell. Hashed assets are resolved from `web-live`, then
`web-previous`, then `web-previous-2`, so a browser running an older HTML shell
can still fetch its lazy chunks while a deployment rolls over.

From `/var/www/plugr` on the VPS, install it with:

```bash
sudo bash deploy/plugr/install-nginx-site.sh
```

The installer backs up the active site file, validates the complete nginx
configuration, and only keeps it after a successful reload. Validation or
reload failure restores and reloads the prior configuration. Its rollback
paths can be checked without touching nginx:

```bash
bash deploy/plugr/test-install-nginx-site.sh
```

## Frontend deploy

Deploy the production frontend from `/var/www/plugr` with:

```bash
bash deploy/plugr/deploy-frontend.sh
```

The deploy script preserves the production fetch/build sequence: it fetches
and resets to `origin/phase-1-rebrand`, runs `bun install`, and builds the `web`
Turbo target. It validates both the build output and a staged copy before any
live symlink changes. It then atomically rotates these paths:

1. `web-live` points to the new release.
2. `web-previous` points to the former live release.
3. `web-previous-2` points to the former previous release.

Only release directories no longer referenced by those three symlinks are
removed. A failed build or copy leaves every live symlink unchanged.
