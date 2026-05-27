# english-listening-web

React/Vite single page app for daily listening lessons. The app reads lessons
from this repository's static `public/content` directory by default, so users do
not need a GitHub PAT at runtime.

## Commands

```bash
npm test
npm run test:unit
npm run test:integration
npm run test:e2e
npm run build
npm run dev
```

## Runtime Config

Create a local `.env` from `.env.example` when overriding defaults:

```env
VITE_GITHUB_OWNER=hiyishui
VITE_CONTENT_REPO=english-listening-content
VITE_CONTENT_BRANCH=main
VITE_CONTENT_SOURCE=static
VITE_STATIC_CONTENT_BASE=
VITE_LOCAL_CONTENT_BASE=/local-content
VITE_LOCAL_CONTENT_REPO_PATH=../english-listening-content
VITE_BASE_PATH=/
```

Static content is served from `public/content`. For GitHub Pages under
`/english-listening-web/`, build with:

```bash
VITE_BASE_PATH=/english-listening-web/ npm run build
```

## Daily Content Automation

Generate today's lesson into `public/content`, commit it, and push this repo:

```bash
./scripts/generate-daily-content.sh
```

Useful overrides:

```bash
PUSH=0 ./scripts/generate-daily-content.sh
FORCE=1 LESSON_DATE=2026-05-24 ./scripts/generate-daily-content.sh
TTS_PROVIDER=edge ./scripts/generate-daily-content.sh
```

Install a macOS LaunchAgent to run daily at 07:00:

```bash
./scripts/install-daily-launchd.sh
```

Set `RUN_AT_HOUR` and `RUN_AT_MINUTE` to change the schedule.
