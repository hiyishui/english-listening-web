import { expect, test } from "@playwright/test";

const index = {
  version: 1,
  lessons: [
    {
      date: "2026-05-24",
      title: "Daily English Listening",
      level: "B1/B2",
      durationSec: 6,
      paths: {
        lesson: "content/lessons/2026-05-24/lesson.json",
        audio: "content/lessons/2026-05-24/audio.mp3",
        captions: "content/lessons/2026-05-24/captions.vtt",
        transcript: "content/lessons/2026-05-24/transcript.txt"
      }
    }
  ]
};

const lesson = {
  version: 1,
  date: "2026-05-24",
  title: "Daily English Listening",
  level: "B1/B2",
  durationSec: 6,
  sentences: [
    { index: 0, text: "Today we practice careful listening.", startSec: 0, endSec: 3 },
    { index: 1, text: "Repeat the phrase out loud.", startSec: 3, endSec: 6 }
  ]
};

test("loads static content and exposes core controls", async ({ page }) => {
  await page.route("**/content/**", async (route) => {
    const url = decodeURIComponent(new URL(route.request().url()).pathname);
    if (!url.startsWith("/content/")) {
      await route.continue();
      return;
    }
    if (url.includes("content/index.json")) {
      await route.fulfill({ json: index });
      return;
    }
    if (url.includes("lesson.json")) {
      await route.fulfill({ json: lesson });
      return;
    }
    if (url.includes("transcript.txt")) {
      await route.fulfill({
        status: 200,
        contentType: "text/plain",
        body: "Today we practice careful listening.\nRepeat the phrase out loud.\n"
      });
      return;
    }
    if (url.includes("captions.vtt")) {
      await route.fulfill({
        status: 200,
        contentType: "text/vtt",
        body: "WEBVTT\n\n00:00:00.000 --> 00:00:03.000\nToday we practice careful listening.\n"
      });
      return;
    }
    if (url.includes("audio.mp3")) {
      await route.fulfill({ status: 200, contentType: "audio/mpeg", body: Buffer.from("audio") });
      return;
    }
    await route.fulfill({ status: 404, body: "missing" });
  });

  await page.goto("/");

  await expect(page.getByRole("heading", { name: "Daily English Listening" })).toBeVisible();
  await expect(page.getByTestId("active-caption")).toHaveText("Today we practice careful listening.");
  await page.getByLabel(/speed/i).selectOption("1.25");
  await expect(page.getByLabel(/speed/i)).toHaveValue("1.25");
});
