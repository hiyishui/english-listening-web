import { vi } from "vitest";

const index = {
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
};

const lesson = {
  version: 1,
  date: "2026-05-24",
  title: "Daily English Listening",
  level: "B1/B2",
  durationSec: 6,
  sentences: [
    { index: 0, text: "Today we practice careful listening.", startSec: 0, endSec: 3 },
    { index: 1, text: "Repeat the phrase out loud.", startSec: 3, endSec: 6 }
  ]
};

const transcript = "Today we practice careful listening.\nRepeat the phrase out loud.\n";
const captions = `WEBVTT

00:00:00.000 --> 00:00:03.000
Today we practice careful listening.

00:00:03.000 --> 00:00:06.000
Repeat the phrase out loud.
`;

export function installMockGitHubFetch(): ReturnType<typeof vi.fn> {
  const fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
    const auth = (init?.headers as Record<string, string>)?.Authorization;
    if (auth !== "Bearer TEST_TOKEN") {
      return new Response("unauthorized", { status: 401 });
    }
    const decoded = decodeURIComponent(url);
    if (decoded.includes("content/index.json")) {
      return jsonContents(index);
    }
    if (decoded.includes("lesson.json")) {
      return jsonContents(lesson);
    }
    if (decoded.includes("transcript.txt")) {
      return textContents(transcript);
    }
    if (decoded.includes("captions.vtt")) {
      return textContents(captions);
    }
    if (decoded.includes("audio.mp3")) {
      return new Response(JSON.stringify({ type: "file", download_url: "https://download.invalid/audio.mp3" }), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      });
    }
    if (url === "https://download.invalid/audio.mp3") {
      return new Response(new Blob(["audio"], { type: "audio/mpeg" }), { status: 200 });
    }
    return new Response("missing", { status: 404 });
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

function jsonContents(value: unknown): Response {
  return textContents(JSON.stringify(value));
}

function textContents(value: string): Response {
  return new Response(
    JSON.stringify({
      type: "file",
      content: btoa(value),
      encoding: "base64"
    }),
    { status: 200, headers: { "Content-Type": "application/json" } }
  );
}
