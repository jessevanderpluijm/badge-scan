#!/bin/bash
# Builds PrintBadges.app — the native event app (portal + printer bridge).
#
#   bash macos-app/build-app.sh              # build, sign, notarize, zip
#   SKIP_NOTARIZE=1 bash macos-app/build-app.sh   # local test build
#
# One-time setup on the build Mac (Jesse):
#   1. Xcode → Settings → Accounts → Manage Certificates → "+" →
#      "Developer ID Application"  (note: Application, not Installer —
#      apps and installers use different certificate types)
#   2. xcrun notarytool store-credentials printbadges-notary \
#        --apple-id <apple-id> --team-id <TEAMID> --password <app-specific>
#
# Output: dist/PrintBadges.app + dist/PrintBadges.zip (notarized+stapled
# when credentials are present — Gatekeeper-clean for customers).
set -euo pipefail

VERSION="${VERSION:-1.0.0}"
IDENTIFIER="com.printbadges.app"
SIGN_IDENTITY="${SIGN_IDENTITY:-Developer ID Application}"
NOTARY_PROFILE="${NOTARY_PROFILE:-printbadges-notary}"

REPO_DIR="$(cd "$(dirname "$0")/.." && pwd)"
DIST="$REPO_DIR/dist"
APP="$DIST/PrintBadges.app"
mkdir -p "$DIST"
rm -rf "$APP" "$DIST/PrintBadges.zip"

# ── 1. Compile (universal: arm64 + x86_64) ──────────────────────────
# The newest SDK on a Mac can be ahead of the command-line-tools Swift
# compiler; pick the newest SDK the compiler actually accepts.
SDK=""
for candidate in MacOSX15.5.sdk MacOSX15.4.sdk MacOSX15.2.sdk MacOSX15.sdk MacOSX14.5.sdk; do
  if [[ -d "/Library/Developer/CommandLineTools/SDKs/$candidate" ]]; then
    SDK="/Library/Developer/CommandLineTools/SDKs/$candidate"
    break
  fi
done
[[ -z "$SDK" ]] && SDK="$(xcrun --show-sdk-path)"
echo "SDK: $SDK"

BIN="$DIST/.printbadges-bin"
rm -rf "$BIN"; mkdir -p "$BIN"
for arch in arm64 x86_64; do
  swiftc -O -sdk "$SDK" -target "$arch-apple-macos12.0" \
    -o "$BIN/PrintBadges-$arch" \
    "$REPO_DIR/macos-app/main.swift"
done
lipo -create "$BIN/PrintBadges-arm64" "$BIN/PrintBadges-x86_64" \
  -output "$BIN/PrintBadges"

# ── 2. Bundle ───────────────────────────────────────────────────────
mkdir -p "$APP/Contents/MacOS" "$APP/Contents/Resources"
cp "$BIN/PrintBadges" "$APP/Contents/MacOS/PrintBadges"
rm -rf "$BIN"

cat > "$APP/Contents/Info.plist" <<PLIST_EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN"
  "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>CFBundleName</key><string>PrintBadges</string>
  <key>CFBundleDisplayName</key><string>PrintBadges</string>
  <key>CFBundleIdentifier</key><string>$IDENTIFIER</string>
  <key>CFBundleVersion</key><string>$VERSION</string>
  <key>CFBundleShortVersionString</key><string>$VERSION</string>
  <key>CFBundleExecutable</key><string>PrintBadges</string>
  <key>CFBundlePackageType</key><string>APPL</string>
  <key>LSMinimumSystemVersion</key><string>12.0</string>
  <key>NSHighResolutionCapable</key><true/>
  <key>NSPrincipalClass</key><string>NSApplication</string>
</dict>
</plist>
PLIST_EOF

# App icon: generated from the repo favicon idea (scan-lines square) if
# iconutil is available and an iconset exists; otherwise the app ships with
# the default icon for now.
if [[ -d "$REPO_DIR/macos-app/AppIcon.iconset" ]]; then
  iconutil -c icns "$REPO_DIR/macos-app/AppIcon.iconset" \
    -o "$APP/Contents/Resources/AppIcon.icns"
  /usr/libexec/PlistBuddy -c "Add :CFBundleIconFile string AppIcon" \
    "$APP/Contents/Info.plist"
fi

# ── 3. Sign + notarize ──────────────────────────────────────────────
if security find-identity -v -p codesigning | grep -q "Developer ID Application"; then
  echo "Ondertekenen met '$SIGN_IDENTITY' …"
  codesign --force --options runtime --timestamp \
    --sign "$SIGN_IDENTITY" "$APP"
  if [[ "${SKIP_NOTARIZE:-}" != "1" ]]; then
    echo "Notariseren bij Apple (profiel: $NOTARY_PROFILE) …"
    ditto -c -k --keepParent "$APP" "$DIST/PrintBadges-notarize.zip"
    xcrun notarytool submit "$DIST/PrintBadges-notarize.zip" \
      --keychain-profile "$NOTARY_PROFILE" --wait
    rm -f "$DIST/PrintBadges-notarize.zip"
    xcrun stapler staple "$APP"
    echo "✅ Ondertekend, genotariseerd en gestapled."
  else
    echo "⚠️  Ondertekend maar NIET genotariseerd (SKIP_NOTARIZE=1)."
  fi
else
  codesign --force --sign - "$APP"
  echo "⚠️  Geen 'Developer ID Application'-certificaat gevonden —"
  echo "    ad-hoc ondertekend (alleen voor lokaal testen)."
fi

# ── 4. Distributable zip ────────────────────────────────────────────
ditto -c -k --keepParent "$APP" "$DIST/PrintBadges.zip"
echo "Klaar: $APP"
du -h "$DIST/PrintBadges.zip" | cut -f1
