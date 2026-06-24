#!/usr/bin/env bash
# College Agent entrypoint wrapper.
#
# Adds Minions Mission Control to the stock Hermes image without forking its
# entrypoint: start Minions in a supervised background loop, then `exec` the stock
# entrypoint so it becomes PID 1 and supervises Hermes/gateway/ttyd/filebrowser
# exactly as upstream. Because this script is the image ENTRYPOINT, it runs on EVERY
# container boot (first run, stop->start, restart, update, reboot) — so Minions is
# always brought up, and the loop restarts it if it crashes.
set -u

MINIONS_PORT="${COLLEGE_AGENT_MINIONS_PORT:-6969}"
MINIONS_HOME="${MINIONS_HOME:-${HOME}/.minions}"
MINIONS_LOG="${MINIONS_HOME}/minions.log"
# Minions drives the baked Hermes via these (set in the full image's env already).
HERMES_AGENT_DIR="${HERMES_AGENT_DIR:-/usr/local/lib/hermes/hermes-agent}"
HERMES_PYTHON="${HERMES_PYTHON:-${HERMES_AGENT_DIR}/venv/bin/python}"
STOCK_ENTRYPOINT="/usr/local/bin/entrypoint.sh"

log() { printf '%s [college-agent] %s\n' "$(date -u +%Y-%m-%dT%H:%M:%SZ)" "$*" >&2; }

start_minions_supervisor() {
  mkdir -p "${MINIONS_HOME}" 2>/dev/null || true
  while true; do
    log "starting Minions (port=${MINIONS_PORT} home=${MINIONS_HOME})"
    env \
      PORT="${MINIONS_PORT}" \
      MINIONS_HOME="${MINIONS_HOME}" \
      HERMES_AGENT_DIR="${HERMES_AGENT_DIR}" \
      HERMES_PYTHON="${HERMES_PYTHON}" \
      minions >>"${MINIONS_LOG}" 2>&1
    log "Minions exited ($?); restarting in 3s"
    sleep 3
  done
}

# Background the supervisor BEFORE exec so it survives as a child of PID 1.
if command -v minions >/dev/null 2>&1; then
  start_minions_supervisor &
  log "Minions supervisor pid=$!"
else
  log "WARNING: 'minions' not found on PATH; skipping Minions."
fi

# Hand off to the stock entrypoint as PID 1 (keeps its signal traps + supervision).
log "handing off to stock entrypoint (${STOCK_ENTRYPOINT})"
exec "${STOCK_ENTRYPOINT}" "$@"
