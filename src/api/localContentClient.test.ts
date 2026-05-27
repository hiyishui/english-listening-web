import { describe, expect, it, vi } from "vitest";

import { LocalContentClient, LocalContentNotFoundError } from "./localContentClient.js";

describe("LocalContentClient", () => {
  it("reads JSON, text, and blobs from the local content base", async () => {
    const fetchMock = vi.fn(async (url: string) => {
      if (url === "/local-content/content/index.json") {
        return new Response(JSON.stringify({ version: 1, lessons: [] }), {
          status: 200,
          headers: { "Content-Type": "application/json" }
        });
      }
      if (url === "/local-content/content/lessons/2026-05-24/transcript.txt") {
        return new Response("Transcript", { status: 200, headers: { "Content-Type": "text/plain" } });
      }
      if (url === "/local-content/content/lessons/2026-05-24/audio.mp3") {
        return new Response("audio", {
          status: 200,
          headers: { "Content-Type": "audio/mpeg" }
        });
      }
      return new Response("missing", { status: 404 });
    });
    vi.stubGlobal("fetch", fetchMock);

    const client = new LocalContentClient({ basePath: "/local-content/" });

    await expect(client.readJson("content/index.json")).resolves.toEqual({ version: 1, lessons: [] });
    await expect(client.readText("content/lessons/2026-05-24/transcript.txt")).resolves.toBe("Transcript");
    await expect((await client.readBlob("content/lessons/2026-05-24/audio.mp3")).text()).resolves.toBe("audio");
  });

  it("encodes path segments while preserving content subdirectories", async () => {
    const fetchMock = vi.fn(async () => new Response("ok", { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    const client = new LocalContentClient({ basePath: "/local-content" });

    await client.readText("content/lessons/2026-05-24/transcript draft.txt");

    expect(fetchMock).toHaveBeenCalledWith("/local-content/content/lessons/2026-05-24/transcript%20draft.txt");
  });

  it("can read static content from the app root", async () => {
    const fetchMock = vi.fn(async () => new Response("ok", { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    const client = new LocalContentClient({ basePath: "/" });

    await client.readText("content/index.json");

    expect(fetchMock).toHaveBeenCalledWith("/content/index.json");
  });

  it("can read static content under a GitHub Pages base path", async () => {
    const fetchMock = vi.fn(async () => new Response("ok", { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    const client = new LocalContentClient({ basePath: "/english-listening-web/" });

    await client.readText("content/index.json");

    expect(fetchMock).toHaveBeenCalledWith("/english-listening-web/content/index.json");
  });

  it("throws a readable missing-content error", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response("missing", { status: 404 })));

    const client = new LocalContentClient({ basePath: "/local-content" });

    await expect(client.readText("content/index.json")).rejects.toThrow(LocalContentNotFoundError);
    await expect(client.readText("content/index.json")).rejects.toThrow("Local content not found: content/index.json");
  });
});
