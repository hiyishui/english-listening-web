import type { LessonIndexEntry } from "../types.js";

export function selectDefaultLesson(lessons: LessonIndexEntry[], today: string): LessonIndexEntry | null {
  if (lessons.length === 0) {
    return null;
  }
  const sorted = [...lessons].sort((left, right) => left.date.localeCompare(right.date));
  const exact = sorted.find((lesson) => lesson.date === today);
  if (exact) {
    return exact;
  }
  const past = sorted.filter((lesson) => lesson.date < today);
  if (past.length > 0) {
    return past[past.length - 1];
  }
  return sorted[0];
}

export function selectLessonByDate(
  lessons: LessonIndexEntry[],
  date: string,
  current: LessonIndexEntry | null
): LessonIndexEntry | null {
  return lessons.find((lesson) => lesson.date === date) || current;
}

export function formatLocalDate(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
