import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(role: "user" | "admin" = "user"): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user-openid",
    email: "test@example.com",
    name: "Test Professional",
    loginMethod: "manus",
    role,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };

  return { ctx };
}

function createPublicContext(): { ctx: TrpcContext } {
  const ctx: TrpcContext = {
    user: null,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };

  return { ctx };
}

describe("auth.me", () => {
  it("returns null for unauthenticated users", async () => {
    const { ctx } = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.me();
    expect(result).toBeNull();
  });

  it("returns user for authenticated users", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.me();
    expect(result).not.toBeNull();
    expect(result?.name).toBe("Test Professional");
    expect(result?.email).toBe("test@example.com");
  });
});

describe("games.list", () => {
  it("returns a list of games (public access)", async () => {
    const { ctx } = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.games.list();
    expect(Array.isArray(result)).toBe(true);
  });

  it("filters games by age group", async () => {
    const { ctx } = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.games.list({ ageGroup: "4-6" });
    expect(Array.isArray(result)).toBe(true);
    result.forEach((game) => {
      expect(game.ageGroups).toContain("4-6");
    });
  });
});

describe("materials.list", () => {
  it("returns a list of materials (public access)", async () => {
    const { ctx } = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.materials.list();
    expect(Array.isArray(result)).toBe(true);
  });
});

describe("videos.list", () => {
  it("returns a list of videos (public access)", async () => {
    const { ctx } = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.videos.list();
    expect(Array.isArray(result)).toBe(true);
  });
});

describe("students.list (protected)", () => {
  it("throws UNAUTHORIZED for unauthenticated users", async () => {
    const { ctx } = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.students.list()).rejects.toThrow();
  });

  it("returns a list for authenticated users", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.students.list();
    expect(Array.isArray(result)).toBe(true);
  });
});

describe("notifications.list (protected)", () => {
  it("throws UNAUTHORIZED for unauthenticated users", async () => {
    const { ctx } = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.notifications.list()).rejects.toThrow();
  });
});

describe("progress.allBadges (protected)", () => {
  it("returns all badges for authenticated users", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.progress.allBadges();
    expect(Array.isArray(result)).toBe(true);
  });
});
