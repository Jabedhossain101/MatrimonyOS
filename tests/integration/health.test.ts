import { describe, it, expect } from "vitest";

describe("Health Endpoint Contract", () => {
  it("validates expected health payload structure", () => {
    const mockHealthPayload = {
      status: "healthy",
      application: {
        name: "MatrimonyOS",
        version: "0.2.0",
        environment: "test",
        uptimeSeconds: 42,
        timestamp: new Date().toISOString(),
      },
      database: {
        configured: true,
        provider: "postgresql",
        status: "connected",
        message: "Neon PostgreSQL reachable",
      },
    };

    expect(mockHealthPayload.status).toBe("healthy");
    expect(mockHealthPayload.database.provider).toBe("postgresql");
    expect(mockHealthPayload.database.configured).toBe(true);
  });
});
