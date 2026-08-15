#!/usr/bin/env bash
# Reuse debug APK + Metro + Maestro. No Gradle.
# On Maestro failure: keep emulator alive and open interactive tmate SSH.
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

set +e
maestro test .maestro/ci-smoke.yaml --format junit --output /tmp/maestro-login-home.xml
MAESTRO_EXIT=$?
set -e

if [[ "$MAESTRO_EXIT" -eq 0 ]]; then
  echo "OK maestro login→home"
  tail -n 20 /tmp/metro.log || true
  kill "$METRO_PID" || true
  exit 0
fi

echo "==== MAESTRO FAILED (exit $MAESTRO_EXIT) ===="
tail -n 60 /tmp/metro.log || true
adb devices -l || true

# If SSH debug disabled, fail immediately (emulator will then be torn down by the action).
if [[ "${DEBUG_SSH_ON_FAILURE:-true}" != "true" ]]; then
  kill "$METRO_PID" || true
  exit "$MAESTRO_EXIT"
fi

echo "==== PAUSING: interactive SSH via tmate (emulator + Metro still UP) ===="
echo "Look in the Actions log for SSH / web URL, then connect and debug with:"
echo "  adb devices"
echo "  adb shell"
echo "  maestro test .maestro/ci-smoke.yaml"
echo "  curl -s http://127.0.0.1:8081/status"
echo "Exit the tmate session (or wait for job timeout) when done."

# Install tmate (same approach as mxschmitt/action-tmate).
if ! command -v tmate >/dev/null 2>&1; then
  curl -fsSL -o /tmp/tmate.tar.xz \
    https://github.com/tmate-io/tmate/releases/download/2.4.0/tmate-2.4.0-static-linux-amd64.tar.xz
  tar -xJf /tmp/tmate.tar.xz -C /tmp
  sudo mv /tmp/tmate-2.4.0-static-linux-amd64/tmate /usr/local/bin/tmate
  sudo chmod +x /usr/local/bin/tmate
fi

# Detached session, print connection info, then block until session ends.
tmate -S /tmp/tmate.sock new-session -d
tmate -S /tmp/tmate.sock wait tmate-ready

echo "----------------------------------------------"
echo "SSH:  $(tmate -S /tmp/tmate.sock display -p '#{tmate_ssh}')"
echo "WEB:  $(tmate -S /tmp/tmate.sock display -p '#{tmate_web}')"
echo "SSH RO: $(tmate -S /tmp/tmate.sock display -p '#{tmate_ssh_ro}')"
echo "WEB RO: $(tmate -S /tmp/tmate.sock display -p '#{tmate_web_ro}')"
echo "----------------------------------------------"

# Keep the step (and therefore the emulator) alive until someone exits tmate
# or the job hits timeout-minutes.
tmate -S /tmp/tmate.sock wait tmate-dead || true

kill "$METRO_PID" || true
exit "$MAESTRO_EXIT"
