# The College Agent — custom Agent37 workspace template.
#
# Hermes (full image: metered LLM + Brave/Composio + browser/desktop) + Minions
# Mission Control + a preinstalled Claude Code CLI. Published to
# ghcr.io/apolloclawplatform/college-agent and registered as the workspace template
# `college-agent` (see register.sh). Referenced by the app in config/agents.ts.
#
# Built FROM the agent37 *full* Hermes image. That base is private on GHCR, so the
# build needs pull creds (`docker login ghcr.io`); the pushed image bakes its layers
# and is self-contained + publicly pullable. Pin the base tag — never :latest.
FROM ghcr.io/agent37-platform/hermes:2026.06.22a

USER root

# Minions (Mission Control for Hermes) + the Claude Code CLI.
# Install into /usr/local (NOT the default /home/node/.npm-global) so the binaries
# survive the persisted /home/node volume mask at runtime — the same reason the base
# keeps Hermes under /usr/local. Lands at /usr/local/bin/{minions,claude}.
#
# Claude Code is preinstalled but UNAUTHENTICATED (bring-your-own auth): students run
# `claude` in the terminal and sign in. No API key is baked — students have full
# terminal/file access, so a baked key would be readable + uncapped.
ARG MINIONSAI_VERSION=0.1.18
ARG CLAUDE_CODE_VERSION=latest
RUN NPM_CONFIG_PREFIX=/usr/local npm install -g \
      "minionsai@${MINIONSAI_VERSION}" \
      "@anthropic-ai/claude-code@${CLAUDE_CODE_VERSION}" \
  && command -v minions >/dev/null \
  && command -v claude  >/dev/null \
  && npm cache clean --force

# Re-expose Hermes' surfaces on NON-reserved ports — the control plane rejects custom
# templates that declare the reserved 3737/7681/8080/9119 (agentPorts.ts), and exposes
# only declared template ports. The stock entrypoint honors these env overrides. The
# gateway's port is set by the platform from the template's default port (3738); Minions
# listens on 6969 (see start.sh).
ENV AGENT37_TERMINAL_PORT=7682 \
    AGENT37_HERMES_DASHBOARD_PORT=9120 \
    AGENT37_FILEBROWSER_PORT=8081 \
    COLLEGE_AGENT_MINIONS_PORT=6969

# Wrapper entrypoint: background Minions (supervised), then exec the stock entrypoint.
COPY --chmod=0755 start.sh /usr/local/bin/college-agent-start.sh

# Documentation only (the platform routes the declared template ports): gateway,
# Minions, terminal, dashboard, files.
EXPOSE 3738 6969 7682 9120 8081

USER node

ENTRYPOINT ["/usr/local/bin/college-agent-start.sh"]
