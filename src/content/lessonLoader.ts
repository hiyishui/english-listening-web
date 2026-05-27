import type { LessonIndex, LessonIndexEntry, LoadedLesson } from "../types.js";
import { parseLesson, parseLessonIndex } from "./schema.js";
import { parseVtt } from "./vtt.js";

export type ContentClient = {
  readJson<T>(path: string): Promise<T>;
  readText(path: string): Promise<string>;
  readBlob(path: string): Promise<Blob>;
};

export async function loadIndex(client: ContentClient): Promise<LessonIndex> {
  return parseLessonIndex(await client.readJson("content/index.json"));
}

export async function loadLesson(client: ContentClient, entry: LessonIndexEntry): Promise<LoadedLesson> {
  const [lessonPayload, transcript, captionsText, audioBlob] = await Promise.all([
    client.readJson(entry.paths.lesson),
    client.readText(entry.paths.transcript),
    client.readText(entry.paths.captions),
    client.readBlob(entry.paths.audio)
  ]);
  const lesson = parseLesson(lessonPayload);
  const captions = lesson.sentences.length > 0 ? lesson.sentences : parseVtt(captionsText);
  const audioUrl = URL.createObjectURL(audioBlob);
  return {
    entry,
    lesson,
    transcript,
    captions,
    audioBlob,
    audioUrl
  };
}
