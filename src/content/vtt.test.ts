import { describe, expect, it } from "vitest";

import { parseVtt } from "./vtt.js";

describe("parseVtt", () => {
  it("parses standard WEBVTT cues", () => {
    expect(
      parseVtt(`WEBVTT

00:00:00.000 --> 00:00:04.200
Hello there.

00:00:04.200 --> 00:00:08.500
Listen carefully.
`)
    ).toEqual([
      { index: 0, text: "Hello there.", startSec: 0, endSec: 4.2 },
      { index: 1, text: "Listen carefully.", startSec: 4.2, endSec: 8.5 }
    ]);
  });

  it("fails on invalid timestamp", () => {
    expect(() => parseVtt("WEBVTT\n\nbad --> 00:00:01.000\nText")).toThrow("timestamp");
  });

  it("fails when cue end is before start", () => {
    expect(() => parseVtt("WEBVTT\n\n00:00:02.000 --> 00:00:01.000\nText")).toThrow("end");
  });
});
