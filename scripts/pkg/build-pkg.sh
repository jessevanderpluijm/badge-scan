#!/bin/bash
# Builds the PrintBadges printer-koppeling installer (.pkg): the double-click
# alternative to the curl|bash one-liner. Self-contained — bundles a
# universal (arm64+x64) Node runtime, so the customer's Mac needs nothing.
#
#   bash scripts/pkg/build-pkg.sh              # build (signs + notarizes
#                                              # when credentials are set up)
#   SKIP_NOTARIZE=1 bash scripts/pkg/build-pkg.sh   # local/unsigned test
#
# One-time setup on the build Mac (Jesse):
#   1. Xcode → Settings → Accounts → [Apple-ID] → Manage Certificates →
#      "+" → Developer ID Installer
#   2. xcrun notarytool store-credentials printbadges-notary \
#        --apple-id <apple-id> --team-id <TEAMID> --password <app-specific>
#
# Output: dist/PrintBadges-Printerkoppeling.pkg (signed + notarized + stapled
# when step 1/2 are done; Gatekeeper-clean for customers).
set -euo pipefail

VERSION="${VERSION:-1.0.0}"
NODE_VERSION="${NODE_VERSION:-v22.22.1}"
IDENTIFIER="com.printbadges.print-agent"
SIGN_IDENTITY="${SIGN_IDENTITY:-Developer ID Installer}"
NOTARY_PROFILE="${NOTARY_PROFILE:-printbadges-notary}"

REPO_DIR="$(cd "$(dirname "$0")/../.." && pwd)"
WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"' EXIT
DIST="$REPO_DIR/dist"
mkdir -p "$DIST"

# ── 1. Universal Node binary (arm64 + x64 via lipo) ─────────────────
NODE_CACHE="$HOME/Library/Caches/printbadges-pkg"
mkdir -p "$NODE_CACHE"
for arch in darwin-arm64 darwin-x64; do
  tarball="node-$NODE_VERSION-$arch.tar.gz"
  if [[ ! -f "$NODE_CACHE/$tarball" ]]; then
    echo "Download Node $NODE_VERSION ($arch) …"
    curl -fL# "https://nodejs.org/dist/$NODE_VERSION/$tarball" \
      -o "$NODE_CACHE/$tarball.tmp"
    mv "$NODE_CACHE/$tarball.tmp" "$NODE_CACHE/$tarball"
  fi
  mkdir -p "$WORK/$arch"
  tar -xzf "$NODE_CACHE/$tarball" -C "$WORK/$arch" --strip-components=2 \
    "node-$NODE_VERSION-$arch/bin/node"
done
# Published checksums guard the downloads (cached copies included).
curl -fsSL "https://nodejs.org/dist/$NODE_VERSION/SHASUMS256.txt" \
  -o "$WORK/SHASUMS256.txt"
(cd "$NODE_CACHE" && grep -E "node-$NODE_VERSION-darwin-(arm64|x64)\.tar\.gz\$" \
  "$WORK/SHASUMS256.txt" | shasum -a 256 -c --status) \
  || { echo "Checksum van Node-download klopt niet." >&2; exit 1; }

# ── 2. Payload ──────────────────────────────────────────────────────
ROOT="$WORK/root"
APP_PATH="Library/Application Support/PrintBadges"
mkdir -p "$ROOT/$APP_PATH"
lipo -create "$WORK/darwin-arm64/node" "$WORK/darwin-x64/node" \
  -output "$ROOT/$APP_PATH/node"
chmod 755 "$ROOT/$APP_PATH/node"
cp "$REPO_DIR/scripts/print-agent.mjs" "$ROOT/$APP_PATH/print-agent.mjs"

# ── 3. Component + distribution pkg ─────────────────────────────────
chmod 755 "$REPO_DIR/scripts/pkg/postinstall"
SCRIPTS="$WORK/scripts"
mkdir -p "$SCRIPTS"
cp "$REPO_DIR/scripts/pkg/postinstall" "$SCRIPTS/postinstall"

pkgbuild \
  --root "$ROOT" \
  --scripts "$SCRIPTS" \
  --identifier "$IDENTIFIER" \
  --version "$VERSION" \
  --install-location / \
  "$WORK/component.pkg" >/dev/null

cat > "$WORK/distribution.xml" <<DIST_EOF
<?xml version="1.0" encoding="utf-8"?>
<installer-gui-script minSpecVersion="2">
  <title>PrintBadges printerkoppeling</title>
  <welcome mime-type="text/plain"><![CDATA[Deze installatie zet de PrintBadges-printerkoppeling op deze Mac. Daarna printen badges automatisch bij het inchecken. De koppeling start vanzelf mee met de Mac; er hoeft verder niets ingesteld te worden.]]></welcome>
  <options customize="never" require-scripts="true" hostArchitectures="arm64,x86_64"/>
  <domains enable_localSystem="true"/>
  <choices-outline><line choice="default"/></choices-outline>
  <choice id="default" title="PrintBadges printerkoppeling">
    <pkg-ref id="$IDENTIFIER"/>
  </choice>
  <pkg-ref id="$IDENTIFIER" version="$VERSION">component.pkg</pkg-ref>
</installer-gui-script>
DIST_EOF

UNSIGNED="$WORK/unsigned.pkg"
productbuild \
  --distribution "$WORK/distribution.xml" \
  --package-path "$WORK" \
  "$UNSIGNED" >/dev/null

OUT="$DIST/PrintBadges-Printerkoppeling.pkg"

# ── 4. Sign + notarize (skipped without credentials) ────────────────
if security find-identity -v | grep -q "Developer ID Installer"; then
  echo "Ondertekenen met '$SIGN_IDENTITY' …"
  productsign --sign "$SIGN_IDENTITY" "$UNSIGNED" "$OUT" >/dev/null
  if [[ "${SKIP_NOTARIZE:-}" != "1" ]]; then
    echo "Notariseren bij Apple (profiel: $NOTARY_PROFILE) …"
    xcrun notarytool submit "$OUT" --keychain-profile "$NOTARY_PROFILE" --wait
    xcrun stapler staple "$OUT"
    echo "✅ Ondertekend, genotariseerd en gestapled: $OUT"
  else
    echo "⚠️  Ondertekend maar NIET genotariseerd (SKIP_NOTARIZE=1): $OUT"
  fi
else
  cp "$UNSIGNED" "$OUT"
  echo "⚠️  Geen 'Developer ID Installer'-certificaat in de keychain —"
  echo "    ONGETEKENDE pkg gebouwd (alleen voor lokaal testen): $OUT"
fi

du -h "$OUT" | cut -f1
