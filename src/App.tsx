import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  CalendarDays,
  LogOut,
  Pause,
  Play,
  RotateCcw,
  SkipBack,
  SkipForward,
  Volume2
} from "lucide-react";

import { GitHubClient } from "./api/githubClient.js";
import { LocalContentClient } from "./api/localContentClient.js";
import { clearToken, readToken, saveToken } from "./auth/tokenStorage.js";
import { readAppConfig } from "./config.js";
import { type ContentClient, loadIndex, loadLesson } from "./content/lessonLoader.js";
import { formatLocalDate, selectDefaultLesson, selectLessonByDate } from "./content/lessonSelection.js";
import {
  findActiveSentenceIndex,
  loopTimeIfNeeded,
  nextSentenceIndex,
  previousSentenceIndex
} from "./player/sentenceNavigation.js";
import type { LessonIndexEntry, LoadedLesson } from "./types.js";

const SPEEDS = [0.75, 1, 1.25, 1.5];

export default function App() {
  const config = useMemo(() => readAppConfig(), []);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [token, setToken] = useState(() => readToken().token);
  const [tokenInput, setTokenInput] = useState("");
  const [rememberDevice, setRememberDevice] = useState(false);
  const [lessons, setLessons] = useState<LessonIndexEntry[]>([]);
  const [selectedEntry, setSelectedEntry] = useState<LessonIndexEntry | null>(null);
  const [loadedLesson, setLoadedLesson] = useState<LoadedLesson | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [loopCurrent, setLoopCurrent] = useState(false);

  const activeSentenceIndex = loadedLesson ? findActiveSentenceIndex(loadedLesson.captions, currentTime) : -1;
  const activeSentence = activeSentenceIndex >= 0 ? loadedLesson?.captions[activeSentenceIndex] : undefined;
  const isLocalSource = config.source === "local";
  const isStaticSource = config.source === "static";
  const isGitHubSource = config.source === "github";

  const client = useMemo<ContentClient | null>(() => {
    if (isStaticSource) {
      return new LocalContentClient({ basePath: config.staticContentBasePath });
    }
    if (isLocalSource) {
      return new LocalContentClient({ basePath: config.localContentBasePath });
    }
    if (!token) {
      return null;
    }
    return new GitHubClient({
      owner: config.owner,
      repo: config.repo,
      branch: config.branch,
      token
    });
  }, [
    config.branch,
    config.localContentBasePath,
    config.owner,
    config.repo,
    config.staticContentBasePath,
    isLocalSource,
    isStaticSource,
    token
  ]);

  const loadInitial = useCallback(async () => {
    if (!client) {
      return;
    }
    setLoading(true);
    setError("");
    try {
      const index = await loadIndex(client);
      setLessons(index.lessons);
      const entry = selectDefaultLesson(index.lessons, formatLocalDate());
      setSelectedEntry(entry);
      if (entry) {
        const nextLesson = await loadLesson(client, entry);
        setLoadedLesson((previous) => replaceLoadedLesson(previous, nextLesson));
        setCurrentTime(0);
      }
    } catch (loadError) {
      setError(toDisplayError(loadError));
    } finally {
      setLoading(false);
    }
  }, [client]);

  useEffect(() => {
    if (client) {
      void loadInitial();
    }
  }, [client, loadInitial]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = speed;
    }
  }, [speed, loadedLesson]);

  useEffect(() => {
    return () => {
      if (loadedLesson) {
        URL.revokeObjectURL?.(loadedLesson.audioUrl);
      }
    };
  }, [loadedLesson]);

  async function handleLogin(event: React.FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    const nextToken = tokenInput.trim();
    if (!nextToken) {
      return;
    }
    saveToken(nextToken, rememberDevice);
    setToken(nextToken);
  }

  function handleLogout(): void {
    clearToken();
    setToken("");
    setTokenInput("");
    setLessons([]);
    setSelectedEntry(null);
    setLoadedLesson((previous) => replaceLoadedLesson(previous, null));
    setError("");
  }

  async function handleDateSelect(date: string): Promise<void> {
    if (!client) {
      return;
    }
    const nextEntry = selectLessonByDate(lessons, date, selectedEntry);
    if (!nextEntry || nextEntry.date === selectedEntry?.date) {
      if (date !== selectedEntry?.date) {
        setError(`No lesson for ${date}.`);
      }
      return;
    }
    setLoading(true);
    setError("");
    try {
      setSelectedEntry(nextEntry);
      const nextLesson = await loadLesson(client, nextEntry);
      setLoadedLesson((previous) => replaceLoadedLesson(previous, nextLesson));
      seekTo(0);
    } catch (loadError) {
      setError(toDisplayError(loadError));
    } finally {
      setLoading(false);
    }
  }

  function seekTo(time: number): void {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
    }
    setCurrentTime(time);
  }

  function handlePlay(): void {
    const playResult = audioRef.current?.play();
    if (playResult && "catch" in playResult) {
      void playResult.catch(() => undefined);
    }
    setIsPlaying(true);
  }

  function handlePause(): void {
    audioRef.current?.pause();
    setIsPlaying(false);
  }

  function handleTimeUpdate(): void {
    const time = audioRef.current?.currentTime || 0;
    const loopTarget = loopTimeIfNeeded(activeSentence, time, loopCurrent);
    if (loopTarget !== null) {
      seekTo(loopTarget);
      const playResult = audioRef.current?.play();
      if (playResult && "catch" in playResult) {
        void playResult.catch(() => undefined);
      }
      return;
    }
    setCurrentTime(time);
  }

  function jumpToSentence(index: number): void {
    const sentence = loadedLesson?.captions[index];
    if (sentence) {
      seekTo(sentence.startSec);
    }
  }

  if (isGitHubSource && !token) {
    return (
      <main className="app-shell login-shell">
        <section className="login-panel" aria-label="GitHub token login">
          <div className="brand-mark">
            <Volume2 aria-hidden="true" size={30} />
          </div>
          <h1>English Listening</h1>
          <form onSubmit={handleLogin} className="login-form">
            <label htmlFor="github-token">GitHub PAT</label>
            <input
              id="github-token"
              type="password"
              autoComplete="off"
              value={tokenInput}
              onChange={(event) => setTokenInput(event.target.value)}
            />
            <label className="remember-row">
              <input
                type="checkbox"
                checked={rememberDevice}
                onChange={(event) => setRememberDevice(event.target.checked)}
              />
              Remember this device
            </label>
            <button type="submit" className="primary-button">
              Load lessons
            </button>
          </form>
        </section>
      </main>
    );
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">Daily listening</p>
          <h1>{loadedLesson?.lesson.title || "English Listening"}</h1>
        </div>
        {isGitHubSource ? (
          <button type="button" className="icon-text-button" onClick={handleLogout} title="Clear token">
            <LogOut aria-hidden="true" size={18} />
            Sign out
          </button>
        ) : (
          <span className="source-pill">{isLocalSource ? "Local files" : "Web content"}</span>
        )}
      </header>

      {error && <div className="error-banner">{error}</div>}
      {loading && <div className="status-line">Loading</div>}

      <div className="workspace">
        <aside className="lesson-list" aria-label="Lesson calendar">
          <div className="section-heading">
            <CalendarDays aria-hidden="true" size={18} />
            <h2>Lessons</h2>
          </div>
          <div className="date-list">
            {lessons.map((lesson) => (
              <button
                key={lesson.date}
                type="button"
                aria-pressed={lesson.date === selectedEntry?.date}
                onClick={() => void handleDateSelect(lesson.date)}
              >
                {lesson.date}
              </button>
            ))}
          </div>
        </aside>

        <section className="lesson-surface" aria-label="Active lesson">
          {loadedLesson ? (
            <>
              <div className="lesson-meta">
                <span>{loadedLesson.lesson.date}</span>
                <span>{loadedLesson.lesson.level}</span>
                <span>{formatDuration(loadedLesson.lesson.durationSec)}</span>
              </div>

              <audio
                ref={audioRef}
                src={loadedLesson.audioUrl}
                onTimeUpdate={handleTimeUpdate}
                onEnded={() => setIsPlaying(false)}
              />

              <section className="controls" aria-label="Playback controls">
                <button type="button" onClick={() => jumpToSentence(previousSentenceIndex(loadedLesson.captions, activeSentenceIndex))} title="Previous sentence">
                  <SkipBack aria-hidden="true" size={20} />
                  <span className="sr-only">Previous sentence</span>
                </button>
                {isPlaying ? (
                  <button type="button" className="play-button" onClick={handlePause} title="Pause">
                    <Pause aria-hidden="true" size={22} />
                    <span className="sr-only">Pause</span>
                  </button>
                ) : (
                  <button type="button" className="play-button" onClick={handlePlay} title="Play">
                    <Play aria-hidden="true" size={22} />
                    <span className="sr-only">Play</span>
                  </button>
                )}
                <button type="button" onClick={() => jumpToSentence(nextSentenceIndex(loadedLesson.captions, activeSentenceIndex))} title="Next sentence">
                  <SkipForward aria-hidden="true" size={20} />
                  <span className="sr-only">Next sentence</span>
                </button>
                <button
                  type="button"
                  aria-pressed={loopCurrent}
                  onClick={() => setLoopCurrent((value) => !value)}
                  title="Loop current sentence"
                >
                  <RotateCcw aria-hidden="true" size={19} />
                  <span className="sr-only">Loop current sentence</span>
                </button>
                <label className="speed-control">
                  Speed
                  <select value={String(speed)} onChange={(event) => setSpeed(Number(event.target.value))}>
                    {SPEEDS.map((value) => (
                      <option key={value} value={value}>
                        {value}x
                      </option>
                    ))}
                  </select>
                </label>
              </section>

              <div className="progress-row">
                <input
                  aria-label="Playback position"
                  type="range"
                  min={0}
                  max={loadedLesson.lesson.durationSec}
                  step={0.1}
                  value={Math.min(currentTime, loadedLesson.lesson.durationSec)}
                  onChange={(event) => seekTo(Number(event.target.value))}
                />
                <span>{formatDuration(currentTime)}</span>
              </div>

              <section className="captions" aria-label="Captions">
                {activeSentence ? (
                  <button
                    key={activeSentence.index}
                    type="button"
                    className="caption active"
                    data-testid="active-caption"
                    onClick={() => jumpToSentence(activeSentenceIndex)}
                  >
                    {activeSentence.text}
                  </button>
                ) : (
                  <div className="caption-placeholder">No active caption</div>
                )}
              </section>

              <section className="transcript" aria-label="Full transcript">
                <h2>Full transcript</h2>
                <p>{loadedLesson.transcript}</p>
              </section>
            </>
          ) : (
            <div className="empty-state">No lessons available</div>
          )}
        </section>
      </div>
    </main>
  );
}

function replaceLoadedLesson(previous: LoadedLesson | null, next: LoadedLesson | null): LoadedLesson | null {
  if (previous) {
    URL.revokeObjectURL?.(previous.audioUrl);
  }
  return next;
}

function toDisplayError(error: unknown): string {
  return error instanceof Error ? error.message : "Unable to load lesson.";
}

function formatDuration(seconds: number): string {
  const safeSeconds = Math.max(0, Math.floor(seconds));
  const minutes = Math.floor(safeSeconds / 60);
  const remainder = safeSeconds % 60;
  return `${minutes}:${String(remainder).padStart(2, "0")}`;
}
