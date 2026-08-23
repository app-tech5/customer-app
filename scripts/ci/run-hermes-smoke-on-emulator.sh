#!/usr/bin/env bash
# Reuse debug APK + Metro + Hermes login→home. Single command for emulator-runner.
set -euo pipefail

APK="${1:?APK path required}"
test -f "$APK"

adb reverse tcp:8081 tcp:8081
adb reverse tcp:8097 tcp:8097 || true

# GitHub sets CI=true which puts Metro in a mode that never exposes a Hermes CDP target.
unset CI
export CI=false

npx expo start --port 8081 --localhost > /tmp/metro.log 2>&1 &
METRO_PID=$!
echo "Metro PID $METRO_PID (CI=$CI)"

for i in $(seq 1 45); do
  if curl -sf http://127.0.0.1:8081/status >/dev/null; then
    echo "Metro ready (${i})"
    break
  fi
  sleep 2
done
curl -sf http://127.0.0.1:8081/status >/dev/null

adb install -r "$APK"
adb shell am force-stop com.goodfoods.goodfoods || true
adb shell am start -n com.goodfoods.goodfoods/.MainActivity \
  -a android.intent.action.MAIN \
  -c android.intent.category.LAUNCHER

READY=0
for i in $(seq 1 60); do
  LIST="$(curl -sf http://127.0.0.1:8081/json/list || true)"
  if echo "$LIST" | grep -q webSocketDebuggerUrl; then
    echo "Hermes CDP target ready (${i})"
    echo "$LIST" | head -c 800
    READY=1
    break
  fi
  if (( i % 10 == 0 )); then
    echo "still waiting CDP… metro tail:"
    tail -n 5 /tmp/metro.log || true
    adb shell am start -n com.goodfoods.goodfoods/.MainActivity >/dev/null || true
  fi
  sleep 2
done

if [[ "$READY" != "1" ]]; then
  echo "ERROR: no Hermes CDP target"
  curl -sf http://127.0.0.1:8081/json/list || true
  echo "==== metro.log ===="
  cat /tmp/metro.log || true
  echo "==== logcat RN ===="
  adb logcat -d -s ReactNative:V ReactNativeJS:V Expo:V | tail -n 100 || true
  kill "$METRO_PID" || true
  exit 1
fi

node scripts/hermes/smoke-login-home.js
kill "$METRO_PID" || true
