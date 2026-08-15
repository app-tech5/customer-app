#!/usr/bin/env bash
# Parcours acheteur (README), sur émulateur CI :
#   npm run android  →  Sign In démo  →  Home
set -euo pipefail

test -f .maestro/ci-smoke.yaml
test -f .env

adb reverse tcp:8081 tcp:8081
adb reverse tcp:8097 tcp:8097 || true

# GitHub Actions sets CI=true; buyer machines do not.
unset CI
export CI=false

echo "==> Buyer: npm run android (expo run:android)"
# Exact README command: builds+installs native app and starts Metro.
npm run android > /tmp/expo-android.log 2>&1 &
ANDROID_PID=$!

# Wait until Metro answers (started by expo run:android).
for i in $(seq 1 120); do
  if curl -sf http://127.0.0.1:8081/status >/dev/null 2>&1; then
    echo "Metro ready (${i})"
    break
  fi
  # Fail fast if the build process died before Metro came up.
  if ! kill -0 "$ANDROID_PID" 2>/dev/null; then
    echo "npm run android exited before Metro was ready"
    tail -n 120 /tmp/expo-android.log || true
    exit 1
  fi
  sleep 5
done
curl -sf http://127.0.0.1:8081/status >/dev/null

# Wait for Gradle install/launch to finish (process may stay alive with Metro).
for i in $(seq 1 90); do
  if adb shell pm path com.goodfoods.goodfoods >/dev/null 2>&1; then
    echo "App installed (${i})"
    break
  fi
  if ! kill -0 "$ANDROID_PID" 2>/dev/null; then
    echo "npm run android exited before app install"
    tail -n 160 /tmp/expo-android.log || true
    exit 1
  fi
  sleep 10
done
adb shell pm path com.goodfoods.goodfoods >/dev/null

# Give the launcher a moment after install.
sleep 15
adb shell settings put system system_locales en-US || true
adb shell am broadcast -a android.intent.action.CLOSE_SYSTEM_DIALOGS || true

echo "==> Maestro login→home"
set +e
maestro test .maestro/ci-smoke.yaml --format junit --output /tmp/maestro-login-home.xml
MAESTRO_EXIT=$?
set -e

# Keep a Metro copy for artifacts (expo logs are already in expo-android.log).
cp /tmp/expo-android.log /tmp/metro.log 2>/dev/null || true
tail -n 40 /tmp/expo-android.log || true

if [[ "$MAESTRO_EXIT" -eq 0 ]]; then
  echo "OK buyer path: login→home"
  kill "$ANDROID_PID" 2>/dev/null || true
  exit 0
fi

echo "==== MAESTRO FAILED (exit $MAESTRO_EXIT) ===="
tail -n 120 /tmp/expo-android.log || true

if [[ "${DEBUG_SSH_ON_FAILURE:-false}" == "true" ]]; then
  echo "==== PAUSING: tmate SSH (emulator + Metro still UP) ===="
  if ! command -v tmate >/dev/null 2>&1; then
    curl -fsSL -o /tmp/tmate.tar.xz \
      https://github.com/tmate-io/tmate/releases/download/2.4.0/tmate-2.4.0-static-linux-amd64.tar.xz
    tar -xJf /tmp/tmate.tar.xz -C /tmp
    sudo mv /tmp/tmate-2.4.0-static-linux-amd64/tmate /usr/local/bin/tmate
    sudo chmod +x /usr/local/bin/tmate
  fi
  tmate -S /tmp/tmate.sock new-session -d
  tmate -S /tmp/tmate.sock wait tmate-ready
  echo "SSH: $(tmate -S /tmp/tmate.sock display -p '#{tmate_ssh}')"
  echo "WEB: $(tmate -S /tmp/tmate.sock display -p '#{tmate_web}')"
  echo "::notice title=tmate SSH::$(tmate -S /tmp/tmate.sock display -p '#{tmate_ssh}')"
  tmate -S /tmp/tmate.sock wait tmate-dead || true
fi

kill "$ANDROID_PID" 2>/dev/null || true
exit "$MAESTRO_EXIT"
