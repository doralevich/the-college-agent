#!/usr/bin/env bash
# Build, push, and register the College Agent template — run via `npm run release:agent`.
# Reads AGENT37_API_KEY (and optional AGENT37_API_BASE_URL) from .env.local.
#
# Prereqs:
#   - docker login ghcr.io   (pull ghcr.io/agent37-platform/*, push ghcr.io/apolloclawplatform/*)
#   - First publish only: set the GHCR package Public ->
#       https://github.com/orgs/ApolloClawPlatform/packages
#
# The Hermes base tag is auto-resolved to the newest date tag in GHCR at build time, so
# you never hand-edit it. Override with HERMES_TAG=YYYY.MM.DD[x] to pin a specific one.
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

BASE_REPO="${BASE_REPO:-agent37-platform/hermes}"

# Resolve the newest Hermes *date* tag (YYYY.MM.DD[x]) straight from GHCR's tag list — the
# source of truth (the docs don't publish a current tag). The anonymous pull token suffices
# for the public tag list. Prints nothing on failure so the caller can fall back / error out.
resolve_hermes_tag() {
  local token
  token="$(curl -fsSL "https://ghcr.io/token?scope=repository:${BASE_REPO}:pull" \
    | grep -o '"token":"[^"]*"' | cut -d'"' -f4)" || return 1
  [ -n "$token" ] || return 1
  curl -fsSL -H "Authorization: Bearer ${token}" \
    "https://ghcr.io/v2/${BASE_REPO}/tags/list" \
    | grep -oE '"[0-9]{4}\.[0-9]{2}\.[0-9]{2}[a-z]*"' \
    | tr -d '"' | LC_ALL=C sort | tail -1
}

AGENT37_API_KEY="${AGENT37_API_KEY:-$(read_env AGENT37_API_KEY)}"
: "${AGENT37_API_KEY:?not found — set AGENT37_API_KEY in .env.local}"

IMAGE="${IMAGE:-ghcr.io/apolloclawplatform/college-agent}"
# Bump this every release — image tags are immutable (date + a revision letter: a, b, c…).
TAG="${TAG:-2026.06.26c}"
NAME="${TEMPLATE_NAME:-college-agent}"
HERMES_TAG="${HERMES_TAG:-$(resolve_hermes_tag || true)}"
: "${HERMES_TAG:?could not resolve a Hermes tag from GHCR — set HERMES_TAG explicitly, e.g. HERMES_TAG=2026.06.26b}"
API="${AGENT37_API:-$(read_env AGENT37_API_BASE_URL)}"; API="${API:-https://api.agent37.com/v1}"
AUTH="Authorization: Bearer ${AGENT37_API_KEY}"

echo "==> Build + push ${IMAGE}:${TAG} (linux/amd64)"
echo "    base: ghcr.io/${BASE_REPO}:${HERMES_TAG}"
docker buildx build --platform linux/amd64 --pull \
  --build-arg "HERMES_TAG=${HERMES_TAG}" \
  -t "${IMAGE}:${TAG}" --push "${DIR}"

BODY=$(cat <<JSON
{
  "name": "${NAME}",
  "image_ref": "${IMAGE}:${TAG}",
  "description": "The College Agent — Hermes + Claude Code.",
  "ports": [
    { "port": 3738, "default": true },
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
