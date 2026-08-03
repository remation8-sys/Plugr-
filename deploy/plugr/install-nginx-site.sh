#!/usr/bin/env bash
set -euo pipefail

install_nginx_site() {
    local source_config="$1"
    local target_config="$2"
    local backup_config="$3"

    cp --preserve=mode,ownership,timestamps "${target_config}" "${backup_config}"
    install -m 0644 "${source_config}" "${target_config}"

    if ! nginx -t; then
        cp --preserve=mode,ownership,timestamps "${backup_config}" "${target_config}"
        if ! nginx -t; then
            echo "nginx validation failed and the restored configuration did not validate." >&2
            return 1
        fi
        echo "nginx validation failed; restored ${backup_config}." >&2
        return 1
    fi

    if ! systemctl reload nginx; then
        cp --preserve=mode,ownership,timestamps "${backup_config}" "${target_config}"
        if ! nginx -t; then
            echo "nginx reload failed and the restored configuration did not validate." >&2
            return 1
        fi
        if ! systemctl reload nginx; then
            echo "nginx reload failed; restored ${backup_config}, but reloading the prior configuration also failed." >&2
            return 1
        fi
        echo "nginx reload failed; restored ${backup_config} and reloaded the prior configuration." >&2
        return 1
    fi

    echo "Installed Plugr nginx performance configuration. Backup: ${backup_config}"
}

main() {
    local repo_root="/var/www/plugr"
    local source_config="${repo_root}/deploy/plugr/nginx-site.conf"
    local target_config="/etc/nginx/sites-available/plugr"
    local backup_config="${target_config}.backup.$(date -u +%Y%m%d-%H%M%S)"

    if [[ "${EUID}" -ne 0 ]]; then
        echo "Run this installer as root."
        return 1
    fi

    if [[ ! -f "${source_config}" ]]; then
        echo "Missing ${source_config}."
        return 1
    fi

    install_nginx_site "${source_config}" "${target_config}" "${backup_config}"
}

if [[ "${BASH_SOURCE[0]}" == "$0" ]]; then
    main "$@"
fi
