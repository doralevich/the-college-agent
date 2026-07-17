import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  deleteAgent: vi.fn(),
  requireAgentAccess: vi.fn(),
  clearStudentIntake: vi.fn(),
  createAdminClient: vi.fn(),
}));

vi.mock("@/lib/agent37", () => {
  class Agent37Error extends Error {
    constructor(
      public status: number,
      public code: string,
      message: string,
    ) {
      super(message);
      this.name = "Agent37Error";
    }
  }

  return {
    Agent37Error,
    agent37: { deleteAgent: mocks.deleteAgent },
  };
});

vi.mock("@/lib/auth", () => ({ requireAgentAccess: mocks.requireAgentAccess }));
vi.mock("@/lib/intake", () => ({ clearStudentIntake: mocks.clearStudentIntake }));
vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: mocks.createAdminClient }));

import { DELETE } from "../../app/api/agents/[id]/route";
import { Agent37Error } from "../../lib/agent37";

function deleteDb(error: { message: string } | null = null) {
  const eq = vi.fn().mockResolvedValue({ error });
  const remove = vi.fn(() => ({ eq }));
  const from = vi.fn(() => ({ delete: remove }));
  return { client: { from }, from, remove, eq };
}

function deleteRequest(id: string) {
  return DELETE(new Request(`http://localhost/api/agents/${id}`), {
    params: Promise.resolve({ id }),
  });
}

describe("DELETE /api/agents/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.clearStudentIntake.mockResolvedValue(undefined);
  });

  it("cleans up the Supabase row through the service client when Agent37 already deleted it", async () => {
    const userDb = deleteDb();
    const adminDb = deleteDb();
    mocks.requireAgentAccess.mockResolvedValue({
      supabase: userDb.client,
      user: { id: "platform-admin" },
      isPlatformAdmin: true,
    });
    mocks.createAdminClient.mockReturnValue(adminDb.client);
    mocks.deleteAgent.mockRejectedValue(
      new Agent37Error(404, "not_found", "Instance not found"),
    );

    const response = await deleteRequest("already-gone");

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ id: "already-gone", deleted: true });
    expect(adminDb.from).toHaveBeenCalledWith("agents");
    expect(adminDb.eq).toHaveBeenCalledWith("agent37_id", "already-gone");
    expect(userDb.from).not.toHaveBeenCalled();
  });

  it("returns an error instead of claiming success when the Supabase delete fails", async () => {
    const userDb = deleteDb({ message: "delete denied" });
    mocks.requireAgentAccess.mockResolvedValue({
      supabase: userDb.client,
      user: { id: "workspace-admin" },
      isPlatformAdmin: false,
    });
    mocks.deleteAgent.mockResolvedValue({ id: "live-agent", deleted: true });

    const response = await deleteRequest("live-agent");

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({
      error: { code: "db_error", message: "delete denied" },
    });
  });
});
