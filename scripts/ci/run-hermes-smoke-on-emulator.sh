#!/usr/bin/env bash
# Emulator smoke: reuse debug APK + Metro + Hermes CDP login → Home.
# Single command for android-emulator-runner (KVM path). NO Gradle here.
set -euo pipefail

APK="${1:?APK path required}"
test -f "$APK"

adb reverse tcp:8081 tcp:8081

# Metro first — debug APK loads JS from the packager.
npx expo start --port 8081 --localhost > /tmp/metro.log 2>&1 &
METRO_PID=$!
echo "Metro PID $METRO_PID"

for i in $(seq 1 60); do
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

# Wait for Hermes/Fusebox CDP target (app must attach to Metro).
READY=0
for i in $(seq 1 90); do
  LIST="$(curl -sf http://127.0.0.1:8081/json/list || true)"
  if echo "$LIST" | grep -q webSocketDebuggerUrl; then
    echo "Hermes CDP target ready (${i})"
    echo "$LIST" | head -c 800
    READY=1
    break
  fi
  # Nudge reload periodically
  if (( i % 15 == 0 )); then
    adb shell input keyevent 82 || true
    adb shell am start -n com.goodfoods.goodfoods/.MainActivity || true
  fi
  sleep 2
done

if [[ "$READY" != "1" ]]; then
  echo "ERROR: no Hermes CDP target"
  curl -sf http://127.0.0.1:8081/json/list || true
  tail -n 80 /tmp/metro.log || true
  adb logcat -d | tail -n 80 || true
  kill "$METRO_PID" || true
  exit 1
fi

node scripts/hermes/smoke-login-home.js

kill "$METRO_PID" || true
