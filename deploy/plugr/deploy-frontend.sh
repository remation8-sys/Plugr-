#!/usr/bin/env bash
# Plugr frontend deploy. Builds a complete release before atomically rotating
# the live frontend and the two bounded asset-fallback releases.
set -euo pipefail

export PATH="/usr/local/bin:/root/.bun/bin:$PATH"

repo_root="/var/www/plugr"
releases_root="${repo_root}/web-releases"
build_output="${repo_root}/dist/packages/web"
branch="phase-1-rebrand"
staging_release=""

cleanup_staging() {
    if [[ -n "${staging_release}" && -d "${staging_release}" ]]; then
        rm -rf -- "${staging_release}"
    fi
}

trap cleanup_staging EXIT

fail() {
    echo "FATAL: $*" >&2
    exit 1
}

validate_web_release() {
    local release_path="$1"

    [[ -f "${release_path}/index.html" ]] || fail "${release_path}/index.html is missing"
    [[ -f "${release_path}/sw.js" ]] || fail "${release_path}/sw.js is missing"
    [[ -f "${release_path}/manifest.webmanifest" ]] || fail "${release_path}/manifest.webmanifest is missing"
    [[ -d "${release_path}/assets" ]] || fail "${release_path}/assets is missing"
    [[ -n "$(find "${release_path}/assets" -type f -print -quit)" ]] || fail "${release_path}/assets is empty"
}

resolve_release() {
    local link_path="$1"

    if [[ ! -e "${link_path}" && ! -L "${link_path}" ]]; then
        return 0
    fi
    [[ -L "${link_path}" ]] || fail "${link_path} exists but is not a symlink"
    readlink -f -- "${link_path}" || fail "${link_path} is a dangling symlink"
}

atomic_symlink() {
    local target_path="$1"
    local link_path="$2"
    local pending_link="${link_path}.next.$$"

    [[ -d "${target_path}" ]] || fail "cannot link missing release ${target_path}"
    rm -f -- "${pending_link}"
    ln -s -- "${target_path}" "${pending_link}"
    mv -Tf -- "${pending_link}" "${link_path}"
}

cleanup_unreferenced_releases() {
    local live_release previous_release previous_2_release candidate
    live_release="$(resolve_release "${repo_root}/web-live")"
    previous_release="$(resolve_release "${repo_root}/web-previous")"
    previous_2_release="$(resolve_release "${repo_root}/web-previous-2")"

    for candidate in "${releases_root}"/*; do
        [[ -d "${candidate}" ]] || continue
        [[ "$(basename "${candidate}")" =~ ^[0-9]{8}-[0-9]{6}-[0-9a-f]{7,40}$ ]] || continue
        if [[ "${candidate}" != "${live_release}" &&
              "${candidate}" != "${previous_release}" &&
              "${candidate}" != "${previous_2_release}" ]]; then
            rm -rf -- "${candidate}"
        fi
    done
}

cd "${repo_root}"

echo "=== bun check ==="
command -v bun >/dev/null || fail "bun not installed (expected at /root/.bun/bin/bun)"
bun --version

echo "=== fetch + reset to origin/${branch} ==="
git fetch origin "${branch}" --depth 1 2>&1 | tail -1
git reset --hard "origin/${branch}" 2>&1 | tail -1
commit="$(git rev-parse --short=12 HEAD)"
echo "commit: ${commit}"

echo "=== install deps ==="
bun install 2>&1 | tail -10

echo "=== build web ==="
npx turbo run build --filter=web 2>&1 | tail -12
validate_web_release "${build_output}"

mkdir -p -- "${releases_root}"
release_id="$(date -u +%Y%m%d-%H%M%S)-${commit}"
release_path="${releases_root}/${release_id}"
staging_release="${releases_root}/.staging-${release_id}-$$"
[[ ! -e "${release_path}" ]] || fail "release already exists: ${release_path}"
mkdir -- "${staging_release}"

echo "=== stage release ${release_id} ==="
cp -a -- "${build_output}/." "${staging_release}/"
validate_web_release "${staging_release}"
mv -- "${staging_release}" "${release_path}"
staging_release=""

old_live="$(resolve_release "${repo_root}/web-live")"
old_previous="$(resolve_release "${repo_root}/web-previous")"
next_previous="${old_live:-${release_path}}"
next_previous_2="${old_previous:-${next_previous}}"

echo "=== rotate release symlinks ==="
# Rotate fallbacks first; web-live remains untouched until the new release has
# been built, copied, and validated. Each rename replaces one symlink atomically.
atomic_symlink "${next_previous_2}" "${repo_root}/web-previous-2"
atomic_symlink "${next_previous}" "${repo_root}/web-previous"
atomic_symlink "${release_path}" "${repo_root}/web-live"

cleanup_unreferenced_releases

echo "live:       $(readlink -f "${repo_root}/web-live")"
echo "previous:   $(readlink -f "${repo_root}/web-previous")"
echo "previous-2: $(readlink -f "${repo_root}/web-previous-2")"
echo "FRONTEND_DEPLOY_OK"
