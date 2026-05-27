import { beforeEach, describe, expect, it } from "vitest";

import { clearToken, normalizeGitHubToken, readToken, saveToken } from "./tokenStorage.js";

describe("tokenStorage", () => {
  beforeEach(() => {
    sessionStorage.clear();
    localStorage.clear();
  });

  it("returns empty state when no token exists", () => {
    expect(readToken()).toEqual({ token: "", source: "none" });
  });

  it("stores submitted token in sessionStorage by default", () => {
    saveToken("TEST_TOKEN", false);

    expect(sessionStorage.getItem("englishListening.githubToken")).toBe("TEST_TOKEN");
    expect(localStorage.getItem("englishListening.githubToken")).toBeNull();
    expect(readToken()).toEqual({ token: "TEST_TOKEN", source: "session" });
  });

  it("normalizes an accidental Bearer prefix", () => {
    expect(normalizeGitHubToken("Bearer TEST_TOKEN")).toBe("TEST_TOKEN");
    saveToken("Bearer TEST_TOKEN", false);
    expect(readToken()).toEqual({ token: "TEST_TOKEN", source: "session" });
  });

  it("stores submitted token in both stores when remembering device", () => {
    saveToken("TEST_TOKEN", true);

    expect(sessionStorage.getItem("englishListening.githubToken")).toBe("TEST_TOKEN");
    expect(localStorage.getItem("englishListening.githubToken")).toBe("TEST_TOKEN");
  });

  it("prefers sessionStorage over localStorage", () => {
    localStorage.setItem("englishListening.githubToken", "LOCAL");
    sessionStorage.setItem("englishListening.githubToken", "SESSION");

    expect(readToken()).toEqual({ token: "SESSION", source: "session" });
  });

  it("falls back to localStorage", () => {
    localStorage.setItem("englishListening.githubToken", "LOCAL");

    expect(readToken()).toEqual({ token: "LOCAL", source: "local" });
  });

  it("clears both stores", () => {
    saveToken("TEST_TOKEN", true);
    clearToken();

    expect(readToken()).toEqual({ token: "", source: "none" });
  });
});
