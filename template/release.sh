#!/usr/bin/env bash
# Build, push, and register the College Agent template — run via `npm run release:agent`.
# Reads AGENT37_API_KEY (and optional AGENT37_API_BASE_URL) from .env.local.
#
# Prereqs:
#   - docker login ghcr.io   (pull ghcr.io/agent37-platform/*, push ghcr.io/apolloclawplatform/*)
#   - First publish only: set the GHCR package Public ->
#       https://github.com/orgs/ApolloClawPlatform/packages
set -euo pipefail

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"   # template/
ROOT="$(dirname "$DIR")"                              # repo root (holds .env.local)

# Pull a single value out of .env.local without sourcing it, so spaces/quotes in other
# vars can't break us. An existing environment variable wins over the file.
read_env() {
  local v
  v="$(grep -E "^$1=." "$ROOT/.env.local" 2>/dev/null | tail -1 | cut -d= -f2- | tr -d '\r')"
  v="${v%\"}"; v="${v#\"}"; v="${v%\'}"; v="${v#\'}"
  printf '%s' "$v"
}

AGENT37_API_KEY="${AGENT37_API_KEY:-$(read_env AGENT37_API_KEY)}"
: "${AGENT37_API_KEY:?not found — set AGENT37_API_KEY in .env.local}"

IMAGE="${IMAGE:-ghcr.io/apolloclawplatform/college-agent}"
TAG="${TAG:-$(date -u +%Y.%m.%d)a}"
NAME="${TEMPLATE_NAME:-college-agent}"
API="${AGENT37_API:-$(read_env AGENT37_API_BASE_URL)}"; API="${API:-https://api.agent37.com/v1}"
AUTH="Authorization: Bearer ${AGENT37_API_KEY}"

echo "==> Build + push ${IMAGE}:${TAG} (linux/amd64)"
docker buildx build --platform linux/amd64 -t "${IMAGE}:${TAG}" --push "${DIR}"

BODY=$(cat <<JSON
{
  "name": "${NAME}",
  "image_ref": "${IMAGE}:${TAG}",
  "description": "The College Agent — Hermes + Minions Mission Control + Claude Code.",
  "ports": [
    { "port": 3738, "default": true },
    { "port": 6969 },
    { "port": 7682 },
    { "port": 9120 },
    { "port": 8081 }
  ]
}
JSON
)

# Create the template the first time, update it (same name) on every release after.
if [ "$(curl -sS -o /dev/null -w '%{http_code}' -H "${AUTH}" "${API}/templates/${NAME}" || true)" = "200" ]; then
  echo "==> Update template ${NAME} (PATCH)"; method=PATCH; url="${API}/templates/${NAME}"
else
  echo "==> Create template ${NAME} (POST)"; method=POST; url="${API}/templates"
fi

code=$(curl -sS -o /tmp/college-agent-template.json -w '%{http_code}' \
  -X "${method}" "${url}" -H "${AUTH}" -H "Content-Type: application/json" -d "${BODY}")
echo "HTTP ${code}"; cat /tmp/college-agent-template.json 2>/dev/null || true; echo
case "${code}" in 2*) echo "OK  ${NAME} -> ${IMAGE}:${TAG}";; *) echo "FAILED"; exit 1;; esac
