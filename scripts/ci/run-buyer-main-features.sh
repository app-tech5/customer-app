#!/usr/bin/env bash
# Customer main features on CI emulator — Expo Dev Client path only.
#   npm run android  →  Metro  →  Maestro main-features
# No APK download / no assembleDebug artifact job.
set -euo pipefail

test -f .maestro/main-features.yaml
test -f .env

adb reverse tcp:8081 tcp:8081
adb reverse tcp:8097 tcp:8097 || true

# GitHub Actions sets CI=true; Expo buyer path expects a normal machine.
unset CI
export CI=false

# Debug signing key (gitignored *.keystore) — ensure present for assembleDebug.
if [[ ! -f android/app/debug.keystore ]]; then
  echo "==> Generating android/app/debug.keystore"
  keytool -genkeypair -v \
    -storetype JKS \
    -keystore android/app/debug.keystore \
    -alias androiddebugkey \
    -keyalg RSA -keysize 2048 -validity 10000 \
    -storepass android -keypass android \
    -dname "CN=Android Debug,O=Android,C=US"
fi

# CI emulator is x86_64 — native splits default to arm64-v8a only.
python3 - <<'PY'
from pathlib import Path
p = Path("android/app/build.gradle")
t = p.read_text()
t2 = t.replace('include "arm64-v8a"', 'include "x86_64"')
if t == t2:
    raise SystemExit("ABI patch failed: arm64-v8a include not found")
p.write_text(t2)
print("ABI splits -> x86_64")
PY
export ORG_GRADLE_PROJECT_reactNativeArchitectures=x86_64

echo "==> Expo: npm run android (dev client + Metro on emulator)"
npm run android > /tmp/expo-android.log 2>&1 &
ANDROID_PID=$!

for i in $(seq 1 120); do
  if curl -sf http://127.0.0.1:8081/status >/dev/null 2>&1; then
    echo "Metro ready (${i})"
    break
  fi
  if ! kill -0 "$ANDROID_PID" 2>/dev/null; then
    echo "npm run android exited before Metro was ready"
    tail -n 120 /tmp/expo-android.log || true
    exit 1
  fi
  sleep 5
done
curl -sf http://127.0.0.1:8081/status >/dev/null

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

sleep 15
adb shell settings put system system_locales en-US || true
adb shell am broadcast -a android.intent.action.CLOSE_SYSTEM_DIALOGS || true

echo "==> Maestro main features"
set +e
maestro test .maestro/main-features.yaml --format junit --output /tmp/maestro-main-features.xml
MAESTRO_EXIT=$?
set -e

cp /tmp/expo-android.log /tmp/metro.log 2>/dev/null || true
tail -n 40 /tmp/expo-android.log || true

if [[ "$MAESTRO_EXIT" -eq 0 ]]; then
  echo "OK buyer path: main features"
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
