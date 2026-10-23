import { execFileSync, spawn } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync, chmodSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { runtimeForTemplate } from "@/config/agents";

// The provisioning script decides which agent runtime a box has before it does anything else,
// because the Hermes branch INSTALLS Hermes. On an OpenClaw box that is a second runtime beside
// the real one, and the student's profile lands where OpenClaw never reads it. It used to guess
// from folders: on a brand-new box OpenClaw's workspace may not exist yet, and on any re-run the
// script's own ~/.hermes folder answered "Hermes". These run the real script in a scratch HOME.

const mocks = vi.hoisted(() => ({ template: "agent37-openclaw" as string | null, home: "" }));

vi.mock("@/lib/agent37", () => ({
  agent37: {
    listAgents: async () => ({ data: [{ id: "box", status: "running", template: mocks.template }] }),
    // Run the script for real, with HOME pointed at a scratch dir and a fake `curl` that records
    // being called instead of downloading anything.
    exec: async (_id: string, command: string) => {
      const stdout = execFileSync("bash", ["-c", command], {
        env: { HOME: mocks.home, PATH: `${mocks.home}/bin:/usr/bin:/bin` } as unknown as NodeJS.ProcessEnv,
        encoding: "utf8",
        timeout: 90_000,
      });
      return { exit_code: 0, stdout, stderr: "", truncated: false };
    },
  },
}));

import { configureHermes, runtimeDetectLine } from "@/lib/hermes";

const persona = { soul: "SOUL for Ben", userProfile: "USER for Ben", fullProfile: "FULL for Ben" };

beforeEach(() => {
  mocks.home = mkdtempSync(join(tmpdir(), "ca-runtime-"));
  mkdirSync(join(mocks.home, "bin"));
  const curl = join(mocks.home, "bin", "curl");
  writeFileSync(curl, `#!/bin/sh\ntouch "${mocks.home}/CURL_CALLED"\nexit 1\n`);
  chmodSync(curl, 0o755);
});

afterEach(() => {
  rmSync(mocks.home, { recursive: true, force: true });
});

describe("runtimeForTemplate", () => {
  it("knows the OpenClaw template and every Hermes name", () => {
    expect(runtimeForTemplate("agent37-openclaw")).toBe("openclaw");
    expect(runtimeForTemplate("college-agent")).toBe("hermes");
    expect(runtimeForTemplate("apollo-agent")).toBe("hermes");
    expect(runtimeForTemplate("something-new")).toBeNull();
    expect(runtimeForTemplate(null)).toBeNull();
  });
});

describe("runtimeDetectLine", () => {
  it("never consults ~/.hermes, which the script creates itself", () => {
    for (const t of ["agent37-openclaw", "college-agent", null]) {
      expect(runtimeDetectLine(t)).not.toMatch(/\.hermes/);
    }
  });
});

describe("configureHermes on an OpenClaw box", () => {
  it("does not install Hermes, and writes the profile into OpenClaw's workspace", async () => {
    mocks.template = "agent37-openclaw";
    mkdirSync(join(mocks.home, ".openclaw", "workspace"), { recursive: true });

    const r = await configureHermes("box", persona);

    expect(r.ok).toBe(true);
    expect(existsSync(join(mocks.home, "CURL_CALLED"))).toBe(false);
    expect(readFileSync(join(mocks.home, ".openclaw", "workspace", "USER.md"), "utf8")).toBe("USER for Ben");
    expect(readFileSync(join(mocks.home, ".openclaw", "workspace", "SOUL.md"), "utf8")).toBe("SOUL for Ben");
  });

  it("is still OpenClaw on a re-run, after ~/.hermes exists", async () => {
    mocks.template = "agent37-openclaw";
    mkdirSync(join(mocks.home, ".openclaw", "workspace"), { recursive: true });
    mkdirSync(join(mocks.home, ".hermes"), { recursive: true });

    await configureHermes("box", persona);

    expect(existsSync(join(mocks.home, "CURL_CALLED"))).toBe(false);
  });

  it("waits for a workspace OpenClaw has not created yet, instead of calling the box Hermes", async () => {
    mocks.template = "agent37-openclaw";
    // OpenClaw finishes booting a few seconds after the script starts. A separate process,
    // because the script runs synchronously and would block a timer in this one.
    const ws = join(mocks.home, ".openclaw", "workspace");
    spawn("sh", ["-c", `sleep 3; mkdir -p "${ws}"`], { stdio: "ignore" });

    const r = await configureHermes("box", persona);

    expect(r.ok).toBe(true);
    expect(existsSync(join(mocks.home, "CURL_CALLED"))).toBe(false);
    expect(readFileSync(join(ws, "USER.md"), "utf8")).toBe("USER for Ben");
  }, 30_000);
});

describe("configureHermes on a Hermes box", () => {
  it("still installs Hermes when the box does not have it", async () => {
    mocks.template = "college-agent";

    await configureHermes("box", persona);

    expect(existsSync(join(mocks.home, "CURL_CALLED"))).toBe(true);
    expect(readFileSync(join(mocks.home, ".hermes", "memories", "USER.md"), "utf8")).toBe("USER for Ben");
  });
});
