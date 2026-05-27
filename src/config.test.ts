import { afterEach, describe, expect, it, vi } from "vitest";

import { readAppConfig } from "./config.js";

describe("readAppConfig", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("defaults to static content served from the app base path", () => {
    vi.stubEnv("BASE_URL", "/english-listening-web/");

    expect(readAppConfig()).toMatchObject({
      source: "static",
      staticContentBasePath: "/english-listening-web/"
    });
  });

  it("keeps legacy GitHub mode only when explicitly configured", () => {
    vi.stubEnv("VITE_CONTENT_SOURCE", "github");

    expect(readAppConfig().source).toBe("github");
  });
});
