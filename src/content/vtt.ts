import type { LessonSentence } from "../types.js";

const TIMESTAMP_RE = /^(\d{2}):(\d{2}):(\d{2})\.(\d{3})$/;

export function parseVtt(contents: string): LessonSentence[] {
  const normalized = contents.replace(/\r\n/g, "\n").trim();
  if (!normalized.startsWith("WEBVTT")) {
    throw new Error("VTT must start with WEBVTT.");
  }

  const cues = normalized
    .split(/\n\n+/)
    .slice(1)
    .map((block) => block.trim())
    .filter(Boolean);

  return cues.map((cue, index) => {
    const lines = cue.split("\n").map((line) => line.trim()).filter(Boolean);
    const timing = lines.find((line) => line.includes("-->"));
    if (!timing) {
      throw new Error("VTT cue is missing timestamp.");
    }
    const [startRaw, endRaw] = timing.split("-->").map((part) => part.trim().split(/\s+/)[0]);
    const startSec = parseTimestamp(startRaw);
    const endSec = parseTimestamp(endRaw);
    if (endSec <= startSec) {
      throw new Error("VTT cue end must be after start.");
    }
    const text = lines.slice(lines.indexOf(timing) + 1).join(" ").trim();
    return {
      index,
      text,
      startSec,
      endSec
    };
  });
}

function parseTimestamp(value: string): number {
  const match = TIMESTAMP_RE.exec(value);
  if (!match) {
    throw new Error(`Invalid VTT timestamp: ${value}`);
  }
  const [, hours, minutes, seconds, millis] = match;
  return Number(hours) * 3600 + Number(minutes) * 60 + Number(seconds) + Number(millis) / 1000;
}
