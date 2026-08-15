#!/usr/bin/env bash
# Reuse debug APK + Metro + Maestro. No Gradle.
set -euo pipefail

APK="${1:?APK path required}"
test -f "$APK"
test -f .maestro/ci-smoke.yaml

adb reverse tcp:8081 tcp:8081

unset CI
export CI=false

npx expo start --port 8081 --localhost > /tmp/metro.log 2>&1 &
METRO_PID=$!
echo "Metro PID $METRO_PID"

for i in $(seq 1 45); do
  if curl -sf http://127.0.0.1:8081/status >/dev/null; then
    echo "Metro ready (${i})"
    break
  fi
  sleep 2
done
curl -sf http://127.0.0.1:8081/status >/dev/null

adb install -r "$APK"
adb shell settings put system system_locales en-US || true
adb shell am broadcast -a android.intent.action.CLOSE_SYSTEM_DIALOGS || true

echo "Starting Maestro…"
maestro test .maestro/ci-smoke.yaml --format junit --output /tmp/maestro-login-home.xml
echo "OK maestro login→home"

echo "==== metro tail ===="
tail -n 40 /tmp/metro.log || true

kill "$METRO_PID" || true
