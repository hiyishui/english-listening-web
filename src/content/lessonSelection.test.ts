import { describe, expect, it } from "vitest";

import { selectDefaultLesson, selectLessonByDate } from "./lessonSelection.js";
import type { LessonIndexEntry } from "../types.js";

const lesson = (date: string): LessonIndexEntry => ({
  date,
  title: date,
  level: "B1/B2",
  durationSec: 10,
  paths: {
    lesson: `content/lessons/${date}/lesson.json`,
    audio: `content/lessons/${date}/audio.mp3`,
    captions: `content/lessons/${date}/captions.vtt`,
    transcript: `content/lessons/${date}/transcript.txt`
  }
});

describe("lessonSelection", () => {
  it("selects today when present", () => {
    expect(selectDefaultLesson([lesson("2026-05-23"), lesson("2026-05-24")], "2026-05-24")?.date).toBe("2026-05-24");
  });

  it("selects latest past date when today is missing", () => {
    expect(selectDefaultLesson([lesson("2026-05-20"), lesson("2026-05-23")], "2026-05-24")?.date).toBe("2026-05-23");
  });

  it("selects earliest future date when no past exists", () => {
    expect(selectDefaultLesson([lesson("2026-05-26"), lesson("2026-05-25")], "2026-05-24")?.date).toBe("2026-05-25");
  });

  it("returns null for empty lists", () => {
    expect(selectDefaultLesson([], "2026-05-24")).toBeNull();
  });

  it("does not depend on input order", () => {
    expect(selectDefaultLesson([lesson("2026-05-21"), lesson("2026-05-24"), lesson("2026-05-23")], "2026-05-22")?.date).toBe(
      "2026-05-21"
    );
  });

  it("keeps current lesson when selected date does not exist", () => {
    const current = lesson("2026-05-23");
    expect(selectLessonByDate([current], "2026-05-24", current)).toBe(current);
  });
});
