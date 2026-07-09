# The College Agent — custom Agent37 workspace template.
#
# Hermes (full image: metered LLM + Brave/Composio + browser/desktop) plus a preinstalled
# Claude Code CLI. Published to ghcr.io/apolloclawplatform/college-agent and registered as
# the workspace template `college-agent` (see release.sh). Referenced by the app in
# config/agents.ts.
#
# Built FROM the agent37 *full* Hermes image. That base is private on GHCR, so the
# build needs pull creds (`docker login ghcr.io`); the pushed image bakes its layers
# and is self-contained + publicly pullable.
#
# The base tag is injected at build time: release.sh resolves the newest Hermes date
# tag from GHCR (the registry is the source of truth — the docs don't publish a current
# tag) and passes it as --build-arg HERMES_TAG=<tag>, logging it for provenance. Each
# release is thus pinned to a concrete, immutable date tag — never the moving :latest.
# The default below is only a convenience for ad-hoc `docker build` runs without the arg;
# override with --build-arg HERMES_TAG=YYYY.MM.DD[x].
ARG HERMES_TAG=latest
FROM ghcr.io/agent37-platform/hermes:${HERMES_TAG}

USER root

# The Claude Code CLI. Install into /usr/local (NOT the default /home/node/.npm-global) so
# the binary survives the persisted /home/node volume mask at runtime — the same reason the
# base keeps Hermes under /usr/local. Lands at /usr/local/bin/claude.
#
# Claude Code is preinstalled but UNAUTHENTICATED (bring-your-own auth): students run
# `claude` in the terminal and sign in. No API key is baked — students have full
# terminal/file access, so a baked key would be readable + uncapped.
ARG CLAUDE_CODE_VERSION=latest
RUN NPM_CONFIG_PREFIX=/usr/local npm install -g \
      "@anthropic-ai/claude-code@${CLAUDE_CODE_VERSION}" \
  && command -v claude >/dev/null \
  && npm cache clean --force

# Stock Hermes ports — no remap. Custom templates used to be barred from Agent37's reserved
# range (3737/7681/8080/9119), so earlier builds moved these; that restriction is gone (every
# container port is reachable at {id}-{port}.agent37.app), so we run stock. The gateway stays
# on its default 3737 — the template declares no default_port, so the bare instance URL routes
# there automatically (see release.sh).

# Documentation only (the platform routes every port at {id}-{port}.agent37.app, and the bare
# instance URL at the default 3737): gateway, terminal, dashboard, files.
EXPOSE 3737 7681 8080 9119

USER node
