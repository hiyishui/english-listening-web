#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WEB_DIR="$(cd "${WEB_DIR:-"$SCRIPT_DIR/.."}" && pwd)"
GENERATOR_DIR="$(cd "${GENERATOR_DIR:-"$WEB_DIR/../english-listening-generator"}" && pwd)"
PUBLIC_DIR="${PUBLIC_DIR:-"$WEB_DIR/public"}"
LESSON_DATE="${LESSON_DATE:-"$(date +%F)"}"
TTS_PROVIDER="${TTS_PROVIDER:-edge}"
PUSH="${PUSH:-1}"
FORCE="${FORCE:-0}"
RUN_WEB_BUILD="${RUN_WEB_BUILD:-1}"

LESSON_DIR="$PUBLIC_DIR/content/lessons/$LESSON_DATE"
LOG_PREFIX="[english-listening]"

if [[ -f "$LESSON_DIR/lesson.json" && "$FORCE" != "1" ]]; then
  echo "$LOG_PREFIX lesson $LESSON_DATE already exists; set FORCE=1 to regenerate."
  exit 0
fi

mkdir -p "$PUBLIC_DIR"

GENERATOR_ARGS=(
  "--date" "$LESSON_DATE"
  "--content-repo-path" "$PUBLIC_DIR"
  "--tts-provider" "$TTS_PROVIDER"
  "--no-git"
)

if [[ "$FORCE" == "1" ]]; then
  GENERATOR_ARGS+=("--force")
fi

echo "$LOG_PREFIX generating lesson $LESSON_DATE into $PUBLIC_DIR/content"
npm --prefix "$GENERATOR_DIR" run generate -- "${GENERATOR_ARGS[@]}"

if [[ "$RUN_WEB_BUILD" == "1" ]]; then
  echo "$LOG_PREFIX validating web build"
  npm --prefix "$WEB_DIR" run build
fi

git -C "$WEB_DIR" add "public/content/index.json" "public/content/lessons/$LESSON_DATE"

if git -C "$WEB_DIR" diff --cached --quiet; then
  echo "$LOG_PREFIX no content changes to commit."
  exit 0
fi

git -C "$WEB_DIR" commit -m "Add lesson $LESSON_DATE"

if [[ "$PUSH" == "1" ]]; then
  git -C "$WEB_DIR" push
else
  echo "$LOG_PREFIX PUSH=0; commit created but not pushed."
fi
