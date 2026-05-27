export type LessonSentence = {
  index: number;
  text: string;
  startSec: number;
  endSec: number;
};

export type Lesson = {
  version: 1;
  date: string;
  title: string;
  level: string;
  durationSec: number;
  sentences: LessonSentence[];
};

export type LessonIndexEntry = {
  date: string;
  title: string;
  level: string;
  durationSec: number;
  paths: {
    lesson: string;
    audio: string;
    captions: string;
    transcript: string;
  };
};

export type LessonIndex = {
  version: 1;
  lessons: LessonIndexEntry[];
};

export type LoadedLesson = {
  entry: LessonIndexEntry;
  lesson: Lesson;
  transcript: string;
  captions: LessonSentence[];
  audioBlob: Blob;
  audioUrl: string;
};
