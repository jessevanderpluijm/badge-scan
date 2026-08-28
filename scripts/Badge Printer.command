#!/bin/bash
# Badge Scan — printerkoppeling
# Dubbelklik dit bestand om de printerkoppeling te starten.
# Laat het venster open staan tijdens het event.
cd "$(dirname "$0")"
clear
echo "======================================"
echo "  Badge Scan – printerkoppeling"
echo "======================================"
echo ""
echo "Dit venster verbindt de Badge Scan portal"
echo "met de badgeprinter (Epson C4000e)."
echo ""
echo "✅ Laat dit venster gewoon OPEN staan."
echo "❌ Sluiten = badges printen stopt (inchecken blijft werken)."
echo ""
exec node print-agent.mjs
