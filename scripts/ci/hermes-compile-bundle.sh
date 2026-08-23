#!/usr/bin/env bash
# Compile / validate Expo export bundles with Hermes (no emulator).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
EXPORT_DIR="${1:-$ROOT/dist}"
PLATFORM="$(uname -s)"

if [[ "$PLATFORM" == "Linux" ]]; then
  HERMESC="$ROOT/node_modules/react-native/sdks/hermesc/linux64-bin/hermesc"
elif [[ "$PLATFORM" == "Darwin" ]]; then
  HERMESC="$ROOT/node_modules/react-native/sdks/hermesc/osx-bin/hermesc"
else
  echo "Unsupported platform: $PLATFORM"
  exit 1
fi

if [[ ! -x "$HERMESC" ]]; then
  echo "hermesc not found/executable: $HERMESC"
  exit 1
fi

if [[ ! -d "$EXPORT_DIR" ]]; then
  echo "Export dir missing: $EXPORT_DIR"
  exit 1
fi

mapfile -t BUNDLES < <(find "$EXPORT_DIR" -type f \( -name '*.js' -o -name '*.hbc' \) | sort)
if [[ ${#BUNDLES[@]} -eq 0 ]]; then
  echo "No JS/HBC bundles under $EXPORT_DIR"
  find "$EXPORT_DIR" -maxdepth 4 -type f | head -50
  exit 1
fi

OUT_DIR="$EXPORT_DIR/_hermes_ci"
mkdir -p "$OUT_DIR"
ok=0

for bundle in "${BUNDLES[@]}"; do
  rel="${bundle#"$EXPORT_DIR"/}"
  base="$(basename "$bundle")"
  echo "==> Hermes check: $rel"
  if [[ "$bundle" == *.hbc ]]; then
    size=$(wc -c < "$bundle")
    if [[ "$size" -lt 1000 ]]; then
      echo "HBC too small ($size bytes): $bundle"
      exit 1
    fi
    echo "OK existing HBC ($size bytes)"
    ok=$((ok + 1))
    continue
  fi
  out="$OUT_DIR/${base%.js}.hbc"
  "$HERMESC" -O -emit-binary -out "$out" "$bundle"
  size=$(wc -c < "$out")
  if [[ "$size" -lt 1000 ]]; then
    echo "Compiled HBC too small ($size bytes)"
    exit 1
  fi
  echo "OK compiled HBC ($size bytes) -> $out"
  ok=$((ok + 1))
done

echo "Hermes OK — validated/compiled $ok bundle(s)"
