import { describe, expect, it } from "vitest";

import { parseLesson, parseLessonIndex } from "./schema.js";

const validIndex = {
  version: 1,
  lessons: [
    {
      date: "2026-05-24",
      title: "Daily English Listening",
      level: "B1/B2",
      durationSec: 10,
      paths: {
        lesson: "content/lessons/2026-05-24/lesson.json",
        audio: "content/lessons/2026-05-24/audio.mp3",
        captions: "content/lessons/2026-05-24/captions.vtt",
        transcript: "content/lessons/2026-05-24/transcript.txt"
      }
    }
  ]
};

const validLesson = {
  version: 1,
  date: "2026-05-24",
  title: "Daily English Listening",
  level: "B1/B2",
  durationSec: 5,
  sentences: [{ index: 0, text: "Hello.", startSec: 0, endSec: 5 }]
};

describe("schema parsing", () => {
  it("parses valid index and lesson", () => {
    expect(parseLessonIndex(validIndex).lessons[0].date).toBe("2026-05-24");
    expect(parseLesson(validLesson).sentences[0].text).toBe("Hello.");
  });

  it("rejects invalid index version", () => {
    expect(() => parseLessonIndex({ ...validIndex, version: 2 })).toThrow("version");
  });

  it("rejects non-array lessons", () => {
    expect(() => parseLessonIndex({ version: 1, lessons: {} })).toThrow("lessons");
  });

  it("rejects invalid lesson date", () => {
    expect(() => parseLessonIndex({ ...validIndex, lessons: [{ ...validIndex.lessons[0], date: "May 24" }] })).toThrow(
      "date"
    );
  });

  it("rejects missing audio path", () => {
    const entry = { ...validIndex.lessons[0], paths: { ...validIndex.lessons[0].paths, audio: undefined } };
    expect(() => parseLessonIndex({ ...validIndex, lessons: [entry] })).toThrow("paths.audio");
  });

  it("rejects empty sentences", () => {
    expect(() => parseLesson({ ...validLesson, sentences: [] })).toThrow("sentences");
  });

  it("rejects invalid sentence times", () => {
    expect(() => parseLesson({ ...validLesson, sentences: [{ index: 0, text: "Bad.", startSec: 5, endSec: 5 }] })).toThrow(
      "startSec"
    );
  });

  it("rejects timeline going backwards", () => {
    expect(() =>
      parseLesson({
        ...validLesson,
        durationSec: 8,
        sentences: [
          { index: 0, text: "One.", startSec: 0, endSec: 5 },
          { index: 1, text: "Two.", startSec: 4, endSec: 8 }
        ]
      })
    ).toThrow("previous");
  });
});
