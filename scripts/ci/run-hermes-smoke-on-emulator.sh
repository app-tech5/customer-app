#!/usr/bin/env bash
# Emulator smoke: Metro + Hermes CDP login → Home (live API).
# Invoked as a single command from android-emulator-runner (do not inline multi-line here).
set -euo pipefail

APK="${1:?APK path required}"
test -f "$APK"

adb install -r "$APK"
adb reverse tcp:8081 tcp:8081

npx expo start --port 8081 --localhost > /tmp/metro.log 2>&1 &
METRO_PID=$!
echo "Metro PID $METRO_PID"

for i in $(seq 1 90); do
  if curl -sf http://127.0.0.1:8081/status >/dev/null; then
    echo "Metro ready"
    break
  fi
  sleep 2
done
curl -sf http://127.0.0.1:8081/status >/dev/null

adb shell am start -n com.goodfoods.goodfoods/.MainActivity

for i in $(seq 1 60); do
  if curl -sf http://127.0.0.1:8081/json/list | grep -q webSocketDebuggerUrl; then
    echo "Hermes CDP target ready"
    break
  fi
  sleep 3
done
curl -sf http://127.0.0.1:8081/json/list | head -c 500 || true

node scripts/hermes/smoke-login-home.js

kill "$METRO_PID" || true
