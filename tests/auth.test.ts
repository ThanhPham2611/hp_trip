import { describe, expect, it } from "vitest";
import { loginSchema } from "../src/lib/schemas";
import { hashPassword, verifyPassword } from "../src/lib/password";
import { createSessionToken, verifySessionToken } from "../src/lib/session";

describe("login schema", () => {
  it("trims username and rejects an empty password", () => {
    const parsed = loginSchema.safeParse({ username: "  linh  ", password: "" });

    expect(parsed.success).toBe(false);
  });

  it("accepts a provided username and password", () => {
    const parsed = loginSchema.parse({ username: " linh ", password: "hp2026" });

    expect(parsed.username).toBe("linh");
    expect(parsed.password).toBe("hp2026");
  });
});

describe("password hashing", () => {
  it("verifies a password against the stored PBKDF2 hash", () => {
    const hash = hashPassword("hp2026", "unit-test-salt", 1000);

    expect(verifyPassword("hp2026", hash)).toBe(true);
    expect(verifyPassword("wrong-password", hash)).toBe(false);
  });
});

describe("session tokens", () => {
  it("creates and verifies a signed session token", () => {
    const token = createSessionToken(
      { userId: "user-1", username: "linh", tripId: "trip-hp" },
      "secret-with-enough-length",
      60
    );

    expect(verifySessionToken(token, "secret-with-enough-length")).toMatchObject({
      userId: "user-1",
      username: "linh",
      tripId: "trip-hp"
    });
  });

  it("rejects a token signed with another secret", () => {
    const token = createSessionToken(
      { userId: "user-1", username: "linh", tripId: "trip-hp" },
      "correct-secret",
      60
    );

    expect(verifySessionToken(token, "wrong-secret")).toBeNull();
  });
});
