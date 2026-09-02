import { describe, expect, it } from "vitest";
import { DEFAULT_AGENT, HOSTING_SHAPES, shapeForHosting } from "../../config/agents";

// The machine shape a student gets must follow their purchased hosting plan, and must never
// throw on a missing/garbage value (provisioning falls back to the Basic floor).
describe("shapeForHosting", () => {
  it("returns the Basic shape for the basic plan", () => {
    expect(shapeForHosting("basic")).toEqual({ cpu: 4, memory: 8, disk: 20 });
  });

  it("returns the Pro shape (doubled) for the pro plan", () => {
    expect(shapeForHosting("pro")).toEqual({ cpu: 8, memory: 16, disk: 40 });
  });

  it("falls back to the Basic floor for null / undefined / unknown values", () => {
    expect(shapeForHosting(null)).toEqual(HOSTING_SHAPES.basic);
    expect(shapeForHosting(undefined)).toEqual(HOSTING_SHAPES.basic);
    expect(shapeForHosting("enterprise")).toEqual(HOSTING_SHAPES.basic);
  });

  it("defaults the no-plan agent to the Basic floor", () => {
    expect({ cpu: DEFAULT_AGENT.cpu, memory: DEFAULT_AGENT.memory, disk: DEFAULT_AGENT.disk }).toEqual(
      HOSTING_SHAPES.basic,
    );
    // The Apollo build. New agents provision from the same image as every other product David
    // sells; `college-agent` was the bespoke Hermes image this app used to be alone on.
    expect(DEFAULT_AGENT.template).toBe("agent37-openclaw");
  });

  // The alias list is not decoration - lib/agent-template.ts walks it when the preferred name
  // isn't in the Agent37 registry, which is what stops a student who pays midway through a
  // template rename from getting a 409 instead of an agent.
  it("keeps the former template names as provisioning fallbacks", () => {
    expect(DEFAULT_AGENT.templateAliases).toContain("college-agent");
    expect(DEFAULT_AGENT.templateAliases).toContain("apollo-agent");
  });
});
