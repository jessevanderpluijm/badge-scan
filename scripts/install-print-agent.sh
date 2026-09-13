#!/bin/bash
# Installs the PrintBadges print agent as a login service (launchd) so it
# starts automatically whenever this Mac is on. Run once per check-in laptop.
#
# Two ways to run it:
#
#   1. Self-serve, from the hosted portal (what the "Kopieer
#      installatiecommando" button on /printer-setup hands out):
#        curl -fsSL https://print-badges.com/print-agent/install.sh | bash
#      The agent script is downloaded next to this Mac's other app data
#      (~/Library/Application Support/PrintBadges/print-agent.mjs). Re-run
#      the same command to upgrade to the latest agent.
#
#   2. From a checkout of the repo (development):
#        bash scripts/install-print-agent.sh
#      Uses scripts/print-agent.mjs in place, so edits take effect after a
#      re-install.
#
#   Either form accepts --uninstall.
#
# Logs: ~/Library/Logs/badge-scan-print-agent.log

set -euo pipefail

LABEL="com.badgescan.print-agent"
PLIST="$HOME/Library/LaunchAgents/$LABEL.plist"
LOG="$HOME/Library/Logs/badge-scan-print-agent.log"
# Where the installer fetches the agent from when it isn't running out of a
# repo checkout. Override with PRINT_AGENT_URL=... for a preview deployment.
AGENT_URL="${PRINT_AGENT_URL:-https://print-badges.com/print-agent/print-agent.mjs}"

if [[ "${1:-}" == "--uninstall" ]]; then
  launchctl bootout "gui/$(id -u)" "$PLIST" 2>/dev/null || true
  rm -f "$PLIST"
  echo "Print agent verwijderd."
  exit 0
fi

if [[ "$(uname -s)" != "Darwin" ]]; then
  echo "De printerkoppeling werkt alleen op macOS." >&2
  exit 1
fi

# Terminal sessions have Homebrew on PATH, but `curl | bash` inherits
# whatever the caller had — so also look in the usual install spots.
NODE_BIN="$(command -v node || true)"
for candidate in /opt/homebrew/bin/node /usr/local/bin/node; do
  [[ -z "$NODE_BIN" && -x "$candidate" ]] && NODE_BIN="$candidate"
done
if [[ -z "$NODE_BIN" ]]; then
  echo "Node.js niet gevonden. Installeer Node via https://nodejs.org (LTS) en voer dit commando daarna opnieuw uit." >&2
  exit 1
fi

# Locate the agent: next to this script when run from the repo, otherwise
# download it. When piped through bash, $0 is "bash" and dirname gives ".",
# so the file check is what decides, not how we were invoked.
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]:-$0}")" 2>/dev/null && pwd || pwd)"
if [[ -f "$SCRIPT_DIR/print-agent.mjs" ]]; then
  AGENT="$SCRIPT_DIR/print-agent.mjs"
  echo "Gebruik agent uit repo: $AGENT"
else
  APP_DIR="$HOME/Library/Application Support/PrintBadges"
  AGENT="$APP_DIR/print-agent.mjs"
  mkdir -p "$APP_DIR"
  echo "Download printerkoppeling van $AGENT_URL …"
  curl -fsSL "$AGENT_URL" -o "$AGENT.tmp"
  if ! head -c 200 "$AGENT.tmp" | grep -q "PrintBadges print agent"; then
    rm -f "$AGENT.tmp"
    echo "Download mislukt: onverwachte inhoud van $AGENT_URL" >&2
    exit 1
  fi
  mv "$AGENT.tmp" "$AGENT"
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
  echo "   Ga terug naar de browser: stap 4 op de installatiepagina wordt nu groen."
else
  echo "⚠️  Agent geïnstalleerd maar reageert (nog) niet — check $LOG"
fi
