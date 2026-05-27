import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import App from "./App.js";
import { clearToken, saveToken } from "./auth/tokenStorage.js";
import { installMockGitHubFetch } from "./test/mockGitHub.js";

describe("App", () => {
  beforeEach(() => {
    clearToken();
    vi.stubGlobal("URL", {
      createObjectURL: vi.fn(() => "blob:lesson-audio"),
      revokeObjectURL: vi.fn()
    });
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("loads static content by default without asking for a GitHub PAT", async () => {
    const fetchMock = installMockStaticContentFetch();

    render(<App />);

    expect(screen.queryByLabelText(/GitHub PAT/i)).not.toBeInTheDocument();
    expect(await screen.findByRole("heading", { name: "Daily English Listening" })).toBeInTheDocument();
    expect(screen.getByText("Today we practice careful listening.")).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith("/content/index.json");
  });

  it("shows PAT input only in legacy GitHub mode when not logged in", () => {
    vi.stubEnv("VITE_CONTENT_SOURCE", "github");

    render(<App />);

    expect(screen.getByLabelText(/GitHub PAT/i)).toBeInTheDocument();
  });

  it("loads mocked private content after token submission", async () => {
    vi.stubEnv("VITE_CONTENT_SOURCE", "github");
    installMockGitHubFetch();
    render(<App />);

    await userEvent.type(screen.getByLabelText(/GitHub PAT/i), "TEST_TOKEN");
    await userEvent.click(screen.getByRole("button", { name: /load lessons/i }));

    expect(await screen.findByRole("heading", { name: "Daily English Listening" })).toBeInTheDocument();
    expect(screen.getByText("Today we practice careful listening.")).toBeInTheDocument();
    expect(screen.getByText(/Full transcript/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "2026-05-24" })).toHaveAttribute("aria-pressed", "true");
  });

  it("loads automatically when a stored token exists and supports playback controls", async () => {
    vi.stubEnv("VITE_CONTENT_SOURCE", "github");
    installMockGitHubFetch();
    saveToken("TEST_TOKEN", false);
    render(<App />);

    expect(await screen.findByRole("heading", { name: "Daily English Listening" })).toBeInTheDocument();
    const controls = screen.getByLabelText("Playback controls");

    await userEvent.click(within(controls).getByRole("button", { name: /play/i }));
    expect(within(controls).getByRole("button", { name: /pause/i })).toBeInTheDocument();

    await userEvent.selectOptions(screen.getByLabelText(/speed/i), "1.25");
    expect(screen.getByLabelText(/speed/i)).toHaveValue("1.25");

    await userEvent.click(within(controls).getByRole("button", { name: /next sentence/i }));
    await waitFor(() => expect(screen.getByTestId("active-caption")).toHaveTextContent("Repeat the phrase out loud."));
  });

  it("shows only the current caption below the player", async () => {
    installMockStaticContentFetch();
    render(<App />);

    expect(await screen.findByRole("heading", { name: "Daily English Listening" })).toBeInTheDocument();
    const captions = screen.getByLabelText("Captions");
    expect(within(captions).getAllByTestId("active-caption")).toHaveLength(1);
    expect(within(captions).getByText("Today we practice careful listening.")).toBeInTheDocument();
    expect(within(captions).queryByText("Repeat the phrase out loud.")).not.toBeInTheDocument();

    await userEvent.click(within(screen.getByLabelText("Playback controls")).getByRole("button", { name: /next sentence/i }));

    await waitFor(() => {
      expect(within(captions).getAllByTestId("active-caption")).toHaveLength(1);
      expect(within(captions).getByText("Repeat the phrase out loud.")).toBeInTheDocument();
      expect(within(captions).queryByText("Today we practice careful listening.")).not.toBeInTheDocument();
    });
  });

  it("loads local content without asking for a GitHub PAT in local source mode", async () => {
    vi.stubEnv("VITE_CONTENT_SOURCE", "local");
    const fetchMock = installMockLocalContentFetch();

    render(<App />);

    expect(screen.queryByLabelText(/GitHub PAT/i)).not.toBeInTheDocument();
    expect(await screen.findByRole("heading", { name: "Daily English Listening" })).toBeInTheDocument();
    expect(screen.getByText("Today we practice careful listening.")).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith("/local-content/content/index.json");
  });
});

function installMockLocalContentFetch(): ReturnType<typeof vi.fn> {
  const fetchMock = vi.fn(async (url: string) => {
    if (url === "/local-content/content/index.json") {
      return jsonResponse({
        version: 1,
        lessons: [
          {
            date: "2026-05-24",
            title: "Daily English Listening",
            level: "B1/B2",
            durationSec: 6,
            paths: {
              lesson: "content/lessons/2026-05-24/lesson.json",
              audio: "content/lessons/2026-05-24/audio.mp3",
              captions: "content/lessons/2026-05-24/captions.vtt",
              transcript: "content/lessons/2026-05-24/transcript.txt"
            }
          }
        ]
      });
    }
    if (url === "/local-content/content/lessons/2026-05-24/lesson.json") {
      return jsonResponse({
        version: 1,
        date: "2026-05-24",
        title: "Daily English Listening",
        level: "B1/B2",
        durationSec: 6,
        sentences: [
          { index: 0, text: "Today we practice careful listening.", startSec: 0, endSec: 3 },
          { index: 1, text: "Repeat the phrase out loud.", startSec: 3, endSec: 6 }
        ]
      });
    }
    if (url === "/local-content/content/lessons/2026-05-24/transcript.txt") {
      return new Response("Today we practice careful listening.\nRepeat the phrase out loud.\n", { status: 200 });
    }
    if (url === "/local-content/content/lessons/2026-05-24/captions.vtt") {
      return new Response("WEBVTT\n\n00:00:00.000 --> 00:00:03.000\nToday we practice careful listening.\n", { status: 200 });
    }
    if (url === "/local-content/content/lessons/2026-05-24/audio.mp3") {
      return new Response(new Blob(["audio"], { type: "audio/mpeg" }), { status: 200 });
    }
    return new Response("missing", { status: 404 });
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

function installMockStaticContentFetch(): ReturnType<typeof vi.fn> {
  return installMockContentFetch("");
}

function installMockContentFetch(basePath: string): ReturnType<typeof vi.fn> {
  const fetchMock = vi.fn(async (url: string) => {
    if (url === `${basePath}/content/index.json`) {
      return jsonResponse({
        version: 1,
        lessons: [
          {
            date: "2026-05-24",
            title: "Daily English Listening",
            level: "B1/B2",
            durationSec: 6,
            paths: {
              lesson: "content/lessons/2026-05-24/lesson.json",
              audio: "content/lessons/2026-05-24/audio.mp3",
              captions: "content/lessons/2026-05-24/captions.vtt",
              transcript: "content/lessons/2026-05-24/transcript.txt"
            }
          }
        ]
      });
    }
    if (url === `${basePath}/content/lessons/2026-05-24/lesson.json`) {
      return jsonResponse({
        version: 1,
        date: "2026-05-24",
        title: "Daily English Listening",
        level: "B1/B2",
        durationSec: 6,
        sentences: [
          { index: 0, text: "Today we practice careful listening.", startSec: 0, endSec: 3 },
          { index: 1, text: "Repeat the phrase out loud.", startSec: 3, endSec: 6 }
        ]
      });
    }
    if (url === `${basePath}/content/lessons/2026-05-24/transcript.txt`) {
      return new Response("Today we practice careful listening.\nRepeat the phrase out loud.\n", { status: 200 });
    }
    if (url === `${basePath}/content/lessons/2026-05-24/captions.vtt`) {
      return new Response("WEBVTT\n\n00:00:00.000 --> 00:00:03.000\nToday we practice careful listening.\n", { status: 200 });
    }
    if (url === `${basePath}/content/lessons/2026-05-24/audio.mp3`) {
      return new Response(new Blob(["audio"], { type: "audio/mpeg" }), { status: 200 });
    }
    return new Response("missing", { status: 404 });
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

function jsonResponse(value: unknown): Response {
  return new Response(JSON.stringify(value), { status: 200, headers: { "Content-Type": "application/json" } });
}
