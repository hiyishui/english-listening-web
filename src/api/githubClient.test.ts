import { afterEach, describe, expect, it, vi } from "vitest";

import {
  ContentNotFoundError,
  GitHubClient,
  InvalidTokenError,
  NetworkError
} from "./githubClient.js";

describe("GitHubClient", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("reads text contents with Authorization Bearer", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          type: "file",
          content: btoa("hello world"),
          encoding: "base64"
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      )
    );
    vi.stubGlobal("fetch", fetchMock);

    const client = new GitHubClient({ owner: "hiyishui", repo: "english-listening-content", branch: "main", token: "TEST" });

    await expect(client.readText("content/index.json")).resolves.toBe("hello world");
    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.github.com/repos/hiyishui/english-listening-content/contents/content/index.json?ref=main",
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: "Bearer TEST",
          Accept: "application/vnd.github+json"
        })
      })
    );
  });

  it("maps 401 and 403 to InvalidTokenError", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("no", { status: 401 })));
    const client = new GitHubClient({ owner: "o", repo: "r", branch: "main", token: "BAD" });

    await expect(client.readText("content/index.json")).rejects.toBeInstanceOf(InvalidTokenError);
  });

  it("maps 404 to ContentNotFoundError", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("missing", { status: 404 })));
    const client = new GitHubClient({ owner: "o", repo: "r", branch: "main", token: "TEST" });

    await expect(client.readText("content/index.json")).rejects.toBeInstanceOf(ContentNotFoundError);
  });

  it("maps network failures to NetworkError", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));
    const client = new GitHubClient({ owner: "o", repo: "r", branch: "main", token: "TEST" });

    await expect(client.readText("content/index.json")).rejects.toBeInstanceOf(NetworkError);
  });

  it("reads audio through download_url with the same token", async () => {
    const audio = new Blob(["audio"], { type: "audio/mpeg" });
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ type: "file", download_url: "https://download.invalid/audio.mp3" }), {
          status: 200,
          headers: { "Content-Type": "application/json" }
        })
      )
      .mockResolvedValueOnce(new Response(audio, { status: 200, headers: { "Content-Type": "audio/mpeg" } }));
    vi.stubGlobal("fetch", fetchMock);

    const client = new GitHubClient({ owner: "o", repo: "r", branch: "main", token: "TEST" });

    await expect(client.readBlob("content/lessons/2026-05-24/audio.mp3")).resolves.toBeInstanceOf(Blob);
    expect(fetchMock).toHaveBeenLastCalledWith(
      "https://download.invalid/audio.mp3",
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: "Bearer TEST" })
      })
    );
  });
});
