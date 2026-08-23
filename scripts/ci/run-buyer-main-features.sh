#!/usr/bin/env bash
# Customer main features on CI emulator — Expo Dev Client path only.
#   Metro first → expo run:android --no-bundler → Maestro main-features
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

# CI emulator is x86_64 — force one ABI (gradle.properties defaults to arm64-v8a).
python3 - <<'PY'
from pathlib import Path

props = Path("android/gradle.properties")
text = props.read_text()
lines = []
found = False
for line in text.splitlines():
    if line.startswith("reactNativeArchitectures="):
        lines.append("reactNativeArchitectures=x86_64")
        found = True
    else:
        lines.append(line)
if not found:
    lines.append("reactNativeArchitectures=x86_64")
props.write_text("\n".join(lines) + "\n")
print("gradle.properties reactNativeArchitectures=x86_64")

gradle = Path("android/app/build.gradle")
t = gradle.read_text()
# Prefer disabling ABI splits on CI so install is a single APK.
t2 = t.replace("enable true", "enable false", 1) if "splits" in t else t
if 'include "arm64-v8a"' in t2:
    t2 = t2.replace('include "arm64-v8a"', 'include "x86_64"')
gradle.write_text(t2)
print("ABI splits disabled / x86_64")
PY
export ORG_GRADLE_PROJECT_reactNativeArchitectures=x86_64

echo "==> Metro first (so Gradle build does not block status endpoint)"
npx expo start --localhost --port 8081 > /tmp/metro.log 2>&1 &
METRO_PID=$!

for i in $(seq 1 60); do
  if curl -sf http://127.0.0.1:8081/status >/dev/null 2>&1; then
    echo "Metro ready (${i})"
    break
  fi
  if ! kill -0 "$METRO_PID" 2>/dev/null; then
    echo "Metro exited early"
    tail -n 120 /tmp/metro.log || true
    exit 1
  fi
  sleep 2
done
curl -sf http://127.0.0.1:8081/status >/dev/null

echo "==> Expo: run:android --no-bundler (dev client install on emulator)"
npx expo run:android --no-bundler > /tmp/expo-android.log 2>&1 &
ANDROID_PID=$!

# First CI Gradle+NDK build can take 20–35+ minutes.
for i in $(seq 1 240); do
  if adb shell pm path com.goodfoods.goodfoods >/dev/null 2>&1; then
    echo "App installed (${i})"
    break
  fi
  if ! kill -0 "$ANDROID_PID" 2>/dev/null; then
    echo "expo run:android exited before app install"
    tail -n 200 /tmp/expo-android.log || true
    kill "$METRO_PID" 2>/dev/null || true
    exit 1
  fi
  # heartbeat every ~2 minutes
  if (( i % 12 == 0 )); then
    echo "still building… (${i}/240) last log:"
    tail -n 3 /tmp/expo-android.log || true
  fi
  sleep 10
done
adb shell pm path com.goodfoods.goodfoods >/dev/null

sleep 20
adb shell settings put system system_locales en-US || true
adb shell am broadcast -a android.intent.action.CLOSE_SYSTEM_DIALOGS || true
# Launch app if install finished but process already exited.
adb shell monkey -p com.goodfoods.goodfoods -c android.intent.category.LAUNCHER 1 >/dev/null 2>&1 || true
sleep 8

echo "==> Maestro main features"
set +e
maestro test .maestro/main-features.yaml --format junit --output /tmp/maestro-main-features.xml
MAESTRO_EXIT=$?
set -e

cp /tmp/metro.log /tmp/metro-copy.log 2>/dev/null || true
tail -n 40 /tmp/expo-android.log || true
tail -n 20 /tmp/metro.log || true

cleanup() {
  kill "$ANDROID_PID" 2>/dev/null || true
  kill "$METRO_PID" 2>/dev/null || true
}

if [[ "$MAESTRO_EXIT" -eq 0 ]]; then
  echo "OK buyer path: main features"
  cleanup
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

cleanup
exit "$MAESTRO_EXIT"
