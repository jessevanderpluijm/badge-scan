#!/bin/bash
# Installs the PrintBadges print agent as a login service (launchd) so it
# starts automatically whenever this Mac is on. Run once per check-in laptop:
#
#   bash scripts/install-print-agent.sh            # install + start
#   bash scripts/install-print-agent.sh --uninstall
#
# Logs: ~/Library/Logs/badge-scan-print-agent.log

set -euo pipefail

LABEL="com.badgescan.print-agent"
PLIST="$HOME/Library/LaunchAgents/$LABEL.plist"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
AGENT="$SCRIPT_DIR/print-agent.mjs"
NODE_BIN="$(command -v node)"
LOG="$HOME/Library/Logs/badge-scan-print-agent.log"

if [[ "${1:-}" == "--uninstall" ]]; then
  launchctl bootout "gui/$(id -u)" "$PLIST" 2>/dev/null || true
  rm -f "$PLIST"
  echo "Print agent verwijderd."
  exit 0
fi

if [[ -z "$NODE_BIN" ]]; then
  echo "Node.js niet gevonden. Installeer Node en probeer opnieuw." >&2
  exit 1
fi

mkdir -p "$HOME/Library/LaunchAgents" "$HOME/Library/Logs"

# Media saving MUST be off on the CUPS queue: with it on, the C4000e skips
# the last ~9mm of every job and the badge tail stays white.
if lpstat -p EPSON_CW_C4000e >/dev/null 2>&1; then
  lpadmin -p EPSON_CW_C4000e -o EPIJ_MdSv=0 || true
fi

cat > "$PLIST" <<PLIST_EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN"
  "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key><string>$LABEL</string>
  <key>ProgramArguments</key>
  <array>
    <string>$NODE_BIN</string>
    <string>$AGENT</string>
  </array>
  <key>RunAtLoad</key><true/>
  <key>KeepAlive</key><true/>
  <key>StandardOutPath</key><string>$LOG</string>
  <key>StandardErrorPath</key><string>$LOG</string>
</dict>
</plist>
PLIST_EOF

launchctl bootout "gui/$(id -u)" "$PLIST" 2>/dev/null || true
launchctl bootstrap "gui/$(id -u)" "$PLIST"

sleep 1
if curl -sf http://127.0.0.1:9123/health >/dev/null; then
  echo "✅ Print agent draait en start voortaan automatisch bij inloggen."
else
  echo "⚠️  Agent geïnstalleerd maar reageert (nog) niet — check $LOG"
fi
