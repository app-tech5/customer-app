#!/usr/bin/env bash
# Parcours acheteur (README), sur émulateur CI :
#   npm start  →  npm run android  →  Sign In démo  →  Home
set -euo pipefail

test -f .maestro/ci-smoke.yaml
test -f .env

adb reverse tcp:8081 tcp:8081
adb reverse tcp:8097 tcp:8097 || true

# GitHub Actions sets CI=true; buyer machines do not — Metro must not be in CI mode.
unset CI
export CI=false

echo "==> Buyer: npm start (Metro)"
npx expo start --localhost --port 8081 > /tmp/metro.log 2>&1 &
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

echo "==> Buyer: npm run android (expo run:android --no-bundler)"
# Metro already running; build+install native app for the connected emulator.
npx expo run:android --no-bundler --port 8081 > /tmp/expo-android.log 2>&1
tail -n 40 /tmp/expo-android.log

adb shell settings put system system_locales en-US || true
adb shell am broadcast -a android.intent.action.CLOSE_SYSTEM_DIALOGS || true

# Dev client may show DEVELOPMENT SERVERS — same as a buyer opening the app after npm start.
echo "==> Maestro login→home"
set +e
maestro test .maestro/ci-smoke.yaml --format junit --output /tmp/maestro-login-home.xml
MAESTRO_EXIT=$?
set -e

if [[ "$MAESTRO_EXIT" -eq 0 ]]; then
  echo "OK buyer path: login→home"
  kill "$METRO_PID" || true
  exit 0
fi

echo "==== MAESTRO FAILED (exit $MAESTRO_EXIT) ===="
tail -n 80 /tmp/metro.log || true
tail -n 80 /tmp/expo-android.log || true

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

kill "$METRO_PID" || true
exit "$MAESTRO_EXIT"
