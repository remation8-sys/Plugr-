#!/usr/bin/env bash
set -euo pipefail

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "${script_dir}/install-nginx-site.sh"

test_root="$(mktemp -d)"
source_config="${test_root}/source.conf"
target_config="${test_root}/target.conf"
backup_config="${test_root}/target.conf.backup"

cleanup() {
    rm -rf -- "${test_root}"
}
trap cleanup EXIT

reset_fixture() {
    printf '%s\n' 'new config' > "${source_config}"
    printf '%s\n' 'old config' > "${target_config}"
    rm -f -- "${backup_config}"
}

assert_old_config_restored() {
    printf '%s\n' 'old config' > "${test_root}/expected.conf"
    cmp --silent "${test_root}/expected.conf" "${target_config}"
}

reset_fixture
nginx_calls=0
reload_calls=0
nginx() {
    ((nginx_calls += 1))
    if [[ "${nginx_calls}" -eq 1 ]]; then
        return 1
    fi
    assert_old_config_restored
}
systemctl() {
    ((reload_calls += 1))
}
if install_nginx_site "${source_config}" "${target_config}" "${backup_config}"; then
    echo "expected nginx validation failure" >&2
    exit 1
fi
assert_old_config_restored
[[ "${nginx_calls}" -eq 2 ]]
[[ "${reload_calls}" -eq 0 ]]

reset_fixture
nginx_calls=0
reload_calls=0
nginx() {
    ((nginx_calls += 1))
}
systemctl() {
    ((reload_calls += 1))
    if [[ "${reload_calls}" -eq 1 ]]; then
        return 1
    fi
    assert_old_config_restored
}
if install_nginx_site "${source_config}" "${target_config}" "${backup_config}"; then
    echo "expected nginx reload failure" >&2
    exit 1
fi
assert_old_config_restored
[[ "${nginx_calls}" -eq 2 ]]
[[ "${reload_calls}" -eq 2 ]]

echo "NGINX_INSTALL_ROLLBACK_TESTS_OK"
