import type { LessonSentence } from "../types.js";

export function findActiveSentenceIndex(sentences: LessonSentence[], currentTime: number): number {
  if (sentences.length === 0) {
    return -1;
  }
  const containing = sentences.findIndex((sentence) => currentTime >= sentence.startSec && currentTime < sentence.endSec);
  if (containing >= 0) {
    return containing;
  }
  if (currentTime < sentences[0].startSec) {
    return 0;
  }
  for (let index = sentences.length - 1; index >= 0; index -= 1) {
    if (sentences[index].startSec <= currentTime) {
      return index;
    }
  }
  return 0;
}

export function nextSentenceIndex(sentences: LessonSentence[], currentIndex: number): number {
  if (sentences.length === 0) {
    return -1;
  }
  return Math.min(sentences.length - 1, Math.max(0, currentIndex) + 1);
}

export function previousSentenceIndex(sentences: LessonSentence[], currentIndex: number): number {
  if (sentences.length === 0) {
    return -1;
  }
  return Math.max(0, Math.max(0, currentIndex) - 1);
}

export function loopTimeIfNeeded(sentence: LessonSentence | undefined, currentTime: number, enabled: boolean): number | null {
  if (!enabled || !sentence) {
    return null;
  }
  return currentTime >= sentence.endSec ? sentence.startSec : null;
}
