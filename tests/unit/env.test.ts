import { describe, it, expect } from "vitest";
import { env } from "@/lib/env";

describe("Environment Configuration Contract", () => {
  it("exposes essential environment variables", () => {
    expect(env.NODE_ENV).toBeDefined();
    expect(env.AUTH_SECRET).toBeDefined();
    expect(env.NEXT_PUBLIC_APP_URL).toBeDefined();
  });

  it("ensures AUTH_SECRET has sufficient entropy", () => {
    expect(env.AUTH_SECRET.length).toBeGreaterThanOrEqual(16);
  });
});
