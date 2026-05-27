import { describe, expect, it } from "vitest";

import {
  findActiveSentenceIndex,
  loopTimeIfNeeded,
  nextSentenceIndex,
  previousSentenceIndex
} from "./sentenceNavigation.js";
import type { LessonSentence } from "../types.js";

const sentences: LessonSentence[] = [
  { index: 0, text: "One.", startSec: 0, endSec: 2 },
  { index: 1, text: "Two.", startSec: 3, endSec: 5 },
  { index: 2, text: "Three.", startSec: 5, endSec: 7 }
];

describe("sentenceNavigation", () => {
  it("finds sentence containing current time", () => {
    expect(findActiveSentenceIndex(sentences, 3.5)).toBe(1);
  });

  it("returns first sentence before timeline starts", () => {
    expect(findActiveSentenceIndex(sentences, -1)).toBe(0);
  });

  it("returns nearest previous sentence for gaps", () => {
    expect(findActiveSentenceIndex(sentences, 2.5)).toBe(0);
  });

  it("moves next and clamps at end", () => {
    expect(nextSentenceIndex(sentences, 0)).toBe(1);
    expect(nextSentenceIndex(sentences, 2)).toBe(2);
  });

  it("moves previous and clamps at start", () => {
    expect(previousSentenceIndex(sentences, 2)).toBe(1);
    expect(previousSentenceIndex(sentences, 0)).toBe(0);
  });

  it("loops to sentence start after endSec", () => {
    expect(loopTimeIfNeeded(sentences[1], 5.1, true)).toBe(3);
    expect(loopTimeIfNeeded(sentences[1], 4.9, true)).toBeNull();
    expect(loopTimeIfNeeded(sentences[1], 5.1, false)).toBeNull();
  });
});
