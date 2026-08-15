#!/usr/bin/env bash
# Single-command Maestro smoke for android-emulator-runner (KVM path).
set -euo pipefail

APK="${1:?APK path required}"
test -f "$APK"
test -f .maestro/ci-smoke.yaml

adb wait-for-device
adb install -r "$APK"
adb shell settings put system system_locales en-US || true
adb shell am broadcast -a android.intent.action.CLOSE_SYSTEM_DIALOGS || true

# Launch via Maestro flow (ci-smoke starts with launchApp).
maestro test .maestro/ci-smoke.yaml --format junit --output /tmp/maestro-login-home.xml

echo "OK maestro login→home"
