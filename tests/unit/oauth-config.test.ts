import { describe, it, expect } from "vitest";
import { auth } from "@/lib/auth";
import { getAuthProvidersStatusAction } from "@/server/actions/auth.actions";

describe("Google OAuth Configuration", () => {
  it("registers Google social provider in Better Auth options when credentials exist", () => {
    const socialProviders = auth.options.socialProviders;
    expect(socialProviders).toBeDefined();
    expect(socialProviders?.google).toBeDefined();
  });

  it("configures the exact provider name 'google'", () => {
    const socialProviders = auth.options.socialProviders;
    expect(Object.keys(socialProviders || {})).toContain("google");
  });

  it("configures non-empty Google client credentials", () => {
    const google = auth.options.socialProviders?.google;
    expect(google?.clientId).toBeDefined();
    expect(typeof google?.clientId).toBe("string");
    expect(google?.clientId.length).toBeGreaterThan(10);
    expect(google?.clientId).toContain(".apps.googleusercontent.com");

    expect(google?.clientSecret).toBeDefined();
    expect(typeof google?.clientSecret).toBe("string");
    expect(google?.clientSecret.length).toBeGreaterThan(5);
  });

  it("sets correct baseURL for OAuth callback resolution", () => {
    expect(auth.options.baseURL).toBe("http://localhost:3000");
  });

  it("reports googleOAuthEnabled as true from server action", async () => {
    const status = await getAuthProvidersStatusAction();
    expect(status.googleOAuthEnabled).toBe(true);
  });

  it("generates a valid Google OAuth authorization redirect URL", async () => {
    const result = await auth.api.signInSocial({
      body: {
        provider: "google",
        callbackURL: "/dashboard",
      },
    });

    expect(result).toBeDefined();
    expect(result.url).toBeDefined();
    expect(result.url).toContain("accounts.google.com");
    expect(result.url).toContain("oauth2");
    expect(result.url).toContain("client_id=");
  });
});

