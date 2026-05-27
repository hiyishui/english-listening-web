#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WEB_DIR="$(cd "${WEB_DIR:-"$SCRIPT_DIR/.."}" && pwd)"
LABEL="${LABEL:-com.hiyishui.english-listening.daily}"
RUN_AT_HOUR="${RUN_AT_HOUR:-7}"
RUN_AT_MINUTE="${RUN_AT_MINUTE:-0}"
PLIST_PATH="$HOME/Library/LaunchAgents/$LABEL.plist"
LOG_PATH="$HOME/Library/Logs/english-listening-daily.log"

mkdir -p "$HOME/Library/LaunchAgents" "$HOME/Library/Logs"

cat > "$PLIST_PATH" <<PLIST
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key>
  <string>$LABEL</string>
  <key>ProgramArguments</key>
  <array>
    <string>/bin/zsh</string>
    <string>-lc</string>
    <string>cd "$WEB_DIR" &amp;&amp; ./scripts/generate-daily-content.sh</string>
  </array>
  <key>StartCalendarInterval</key>
  <dict>
    <key>Hour</key>
    <integer>$RUN_AT_HOUR</integer>
    <key>Minute</key>
    <integer>$RUN_AT_MINUTE</integer>
  </dict>
  <key>StandardOutPath</key>
  <string>$LOG_PATH</string>
  <key>StandardErrorPath</key>
  <string>$LOG_PATH</string>
  <key>WorkingDirectory</key>
  <string>$WEB_DIR</string>
</dict>
</plist>
PLIST

launchctl unload "$PLIST_PATH" >/dev/null 2>&1 || true
launchctl load "$PLIST_PATH"

echo "Installed $LABEL at $PLIST_PATH"
echo "Daily run time: ${RUN_AT_HOUR}:${RUN_AT_MINUTE}"
echo "Log: $LOG_PATH"
