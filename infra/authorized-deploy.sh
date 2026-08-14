#!/usr/bin/env bash
set -Eeuo pipefail

readonly COMMAND="${SSH_ORIGINAL_COMMAND:-}"

if [[ "$COMMAND" =~ ^deploy\ ([0-9a-f]{40})$ ]]; then
  exec /opt/thiqwave-app/bin/deploy "${BASH_REMATCH[1]}"
fi

printf 'Rejected deployment command.\n' >&2
exit 1
