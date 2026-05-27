import type { Lesson, LessonIndex, LessonIndexEntry, LessonSentence } from "../types.js";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export function parseLessonIndex(value: unknown): LessonIndex {
  const index = assertObject(value, "index");
  assertEqual(index.version, 1, "index.version");
  if (!Array.isArray(index.lessons)) {
    throw new Error("index.lessons must be an array.");
  }
  const lessons = index.lessons.map((entry, position) => parseIndexEntry(entry, position));
  return { version: 1, lessons };
}

export function parseLesson(value: unknown): Lesson {
  const lesson = assertObject(value, "lesson");
  assertEqual(lesson.version, 1, "lesson.version");
  assertDate(lesson.date, "lesson.date");
  assertString(lesson.title, "lesson.title");
  assertString(lesson.level, "lesson.level");
  assertNumber(lesson.durationSec, "lesson.durationSec");
  if (!Array.isArray(lesson.sentences) || lesson.sentences.length === 0) {
    throw new Error("lesson.sentences must be a non-empty array.");
  }

  let previousEnd = 0;
  const sentences = lesson.sentences.map((sentence, index) => {
    const parsed = parseSentence(sentence, index, previousEnd);
    previousEnd = parsed.endSec;
    return parsed;
  });
  if (lesson.durationSec < previousEnd) {
    throw new Error("lesson.durationSec must be greater than or equal to the final sentence endSec.");
  }

  return {
    version: 1,
    date: lesson.date,
    title: lesson.title,
    level: lesson.level,
    durationSec: lesson.durationSec,
    sentences
  };
}

function parseIndexEntry(value: unknown, position: number): LessonIndexEntry {
  const entry = assertObject(value, `index.lessons[${position}]`);
  assertDate(entry.date, `index.lessons[${position}].date`);
  assertString(entry.title, `index.lessons[${position}].title`);
  assertString(entry.level, `index.lessons[${position}].level`);
  assertNumber(entry.durationSec, `index.lessons[${position}].durationSec`);
  const paths = assertObject(entry.paths, `index.lessons[${position}].paths`);
  assertString(paths.lesson, `index.lessons[${position}].paths.lesson`);
  assertString(paths.audio, `index.lessons[${position}].paths.audio`);
  assertString(paths.captions, `index.lessons[${position}].paths.captions`);
  assertString(paths.transcript, `index.lessons[${position}].paths.transcript`);
  return {
    date: entry.date,
    title: entry.title,
    level: entry.level,
    durationSec: entry.durationSec,
    paths: {
      lesson: paths.lesson,
      audio: paths.audio,
      captions: paths.captions,
      transcript: paths.transcript
    }
  };
}

function parseSentence(value: unknown, expectedIndex: number, previousEnd: number): LessonSentence {
  const sentence = assertObject(value, `lesson.sentences[${expectedIndex}]`);
  assertEqual(sentence.index, expectedIndex, `lesson.sentences[${expectedIndex}].index`);
  assertString(sentence.text, `lesson.sentences[${expectedIndex}].text`);
  assertNumber(sentence.startSec, `lesson.sentences[${expectedIndex}].startSec`);
  assertNumber(sentence.endSec, `lesson.sentences[${expectedIndex}].endSec`);
  if (sentence.startSec >= sentence.endSec) {
    throw new Error(`lesson.sentences[${expectedIndex}].startSec must be less than endSec.`);
  }
  if (sentence.startSec < previousEnd) {
    throw new Error(`lesson.sentences[${expectedIndex}].startSec must be >= previous sentence endSec.`);
  }
  return {
    index: sentence.index,
    text: sentence.text,
    startSec: sentence.startSec,
    endSec: sentence.endSec
  };
}

function assertObject(value: unknown, name: string): Record<string, any> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`${name} must be an object.`);
  }
  return value as Record<string, any>;
}

function assertEqual(value: unknown, expected: unknown, name: string): void {
  if (value !== expected) {
    throw new Error(`${name} must be ${String(expected)}.`);
  }
}

function assertString(value: unknown, name: string): asserts value is string {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`${name} must be a non-empty string.`);
  }
}

function assertNumber(value: unknown, name: string): asserts value is number {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
    throw new Error(`${name} must be a non-negative number.`);
  }
}

function assertDate(value: unknown, name: string): asserts value is string {
  assertString(value, name);
  if (!DATE_RE.test(value)) {
    throw new Error(`${name} must use YYYY-MM-DD format.`);
  }
}
