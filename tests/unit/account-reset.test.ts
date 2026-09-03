import { beforeEach, describe, expect, it, vi } from "vitest";

// A reset touches a real instance and a real student's answers. The failure modes are both
// silent: clearing rows without tearing the box down leaves a billed orphan nothing in the
// database knows about, and clearing one table too many takes away the paid entitlement that
// made a repeatable test possible in the first place.

const mocks = vi.hoisted(() => ({
  deleteAgent: vi.fn(),
  createAdminClient: vi.fn(),
}));

vi.mock("@/lib/agent37", () => {
  class Agent37Error extends Error {
    constructor(
      public status: number,
      public code: string,
      message: string
    ) {
      super(message);
      this.name = "Agent37Error";
    }
  }
  return { Agent37Error, agent37: { deleteAgent: mocks.deleteAgent } };
});
vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: mocks.createAdminClient }));

import { resetStudentAccount } from "../../lib/account-reset";
import { Agent37Error } from "../../lib/agent37";

/**
 * A Supabase stand-in that records the order of operations.
 *
 * `calls` is the transcript the assertions read: "select:agents", "delete:onboard_submissions"
 * and so on, in the order they happened.
 */
function fakeDb(opts: { workspaces?: string[]; agents?: string[] } = {}) {
  const calls: string[] = [];
  const rows: Record<string, unknown[]> = {
    workspaces: (opts.workspaces ?? ["ws-1"]).map((id) => ({ id })),
    agents: (opts.agents ?? ["box-1"]).map((agent37_id) => ({ agent37_id })),
    onboard_submissions: [{ resume_url: null }],
  };

  const from = vi.fn((table: string) => ({
    select: () => {
      calls.push(`select:${table}`);
      const result = { data: rows[table] ?? [], error: null };
      return {
        eq: () => result,
        in: () => result,
      };
    },
    delete: () => {
      calls.push(`delete:${table}`);
      const result = { count: 1, error: null };
      return { eq: () => result, in: () => result };
    },
  }));

  return {
    calls,
    client: {
      from,
      storage: { from: () => ({ remove: vi.fn().mockResolvedValue({ error: null }) }) },
    },
  };
}

describe("resetStudentAccount", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.deleteAgent.mockResolvedValue(undefined);
  });

  it("tears the instance down BEFORE deleting the row that names it", async () => {
    const db = fakeDb({ agents: ["box-1"] });
    mocks.createAdminClient.mockReturnValue(db.client);
    // Route the teardown through the same transcript as the queries, so the assertion is
    // about real ordering rather than two counters that happen to compare favourably.
    mocks.deleteAgent.mockImplementation((id: string) => {
      db.calls.push(`teardown:${id}`);
      return Promise.resolve();
    });

    const report = await resetStudentAccount({ userId: "student-1" });

    expect(mocks.deleteAgent).toHaveBeenCalledWith("box-1");
    expect(report.agentsDeleted).toEqual(["box-1"]);
    // The whole point: reverse these two and the id is gone while the box keeps billing.
    expect(db.calls.indexOf("teardown:box-1")).toBeGreaterThan(-1);
    expect(db.calls.indexOf("teardown:box-1")).toBeLessThan(db.calls.indexOf("delete:agents"));
    // And the id has to be read before it can be torn down.
    expect(db.calls.indexOf("select:agents")).toBeLessThan(db.calls.indexOf("teardown:box-1"));
  });

  it("keeps the account, the workspace and everything that says they paid", async () => {
    const db = fakeDb();
    mocks.createAdminClient.mockReturnValue(db.client);

    await resetStudentAccount({ userId: "student-1" });

    // An account that has to buy again before the next run is not a reset. Nor is one whose
    // workspace disappeared - that is the duplicate-workspace mess, re-made.
    const deleted = db.calls.filter((c) => c.startsWith("delete:"));
    for (const table of ["entitlements", "orders", "workspaces", "memberships"]) {
      expect(deleted).not.toContain(`delete:${table}`);
    }
  });

  it("clears exactly what the funnel wrote", async () => {
    const db = fakeDb();
    mocks.createAdminClient.mockReturnValue(db.client);

    await resetStudentAccount({ userId: "student-1" });

    // agent_channels and checkin_schedules are absent on purpose: both cascade off the
    // agents row (migrations 0023, 0024), so deleting them here would be a second way to
    // say the same thing, and one that goes stale the day the FK changes.
    for (const table of [
      "chat_sessions",
      "agents",
      "onboard_submissions",
      "setup_submissions",
      "checklist_items",
    ]) {
      expect(db.calls).toContain(`delete:${table}`);
    }
  });

  it("treats an instance already gone upstream as torn down", async () => {
    // Deleting it by hand in the Agent37 dashboard first is the common case, and it must not
    // strand the row - that orphan is what the reset exists to avoid.
    mocks.deleteAgent.mockRejectedValue(new Agent37Error(404, "not_found", "no such agent"));
    const db = fakeDb({ agents: ["box-gone"] });
    mocks.createAdminClient.mockReturnValue(db.client);

    const report = await resetStudentAccount({ userId: "student-1" });

    expect(report.agentsDeleted).toEqual(["box-gone"]);
    expect(report.errors).toEqual([]);
    expect(db.calls).toContain("delete:agents");
  });

  it("reports a teardown failure instead of throwing, and still clears the intake", async () => {
    // Half a reset an operator can see beats an exception that leaves them guessing which
    // half happened.
    mocks.deleteAgent.mockRejectedValue(new Error("agent37 unreachable"));
    const db = fakeDb({ agents: ["box-1"] });
    mocks.createAdminClient.mockReturnValue(db.client);

    const report = await resetStudentAccount({ userId: "student-1" });

    expect(report.agentsDeleted).toEqual([]);
    expect(report.errors.join(" ")).toContain("agent37 unreachable");
    expect(db.calls).toContain("delete:onboard_submissions");
  });

  it("does nothing to agents when the account owns no workspace", async () => {
    const db = fakeDb({ workspaces: [], agents: [] });
    mocks.createAdminClient.mockReturnValue(db.client);

    const report = await resetStudentAccount({ userId: "student-1" });

    expect(mocks.deleteAgent).not.toHaveBeenCalled();
    expect(report.agentsDeleted).toEqual([]);
    expect(db.calls).not.toContain("delete:agents");
    // The intake is still theirs to clear — it hangs off the user, not the workspace.
    expect(db.calls).toContain("delete:onboard_submissions");
  });
});
