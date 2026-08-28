# Badges automatisch printen

Als je incheckt (via de scanner of de bezoekerslijst) print Badge Scan de badge
direct op de Epson ColorWorks C4000e. Daarvoor draait op de incheck-laptop een
kleine "printerkoppeling" — één scriptje, geen aparte app.

## Eenmalige installatie (per laptop)

1. Sluit de printer aan via USB en zorg dat 'ie werkt (zie hieronder).
2. Open Terminal in de projectmap en run:

```bash
bash scripts/install-print-agent.sh
```

Klaar. De koppeling start voortaan **automatisch** zodra de laptop aanstaat —
op de eventdag hoef je niets te doen.

## Op de eventdag

Niets. Open de scanpagina van je event; onderin zie je de status:

- 🖨️ **Printer verbonden · print automatisch** — elke geldige scan print direct
  een badge. Klik op deze tekst om automatisch printen aan/uit te zetten.
- **Geen printer — alleen inchecken** — de koppeling draait niet (of dit is
  een laptop zonder printer). Inchecken werkt gewoon door.

Bij elke scan zie je ook per bezoeker: *Badge wordt geprint… → Badge naar de
printer ✓*, en een knop **Print badge opnieuw** voor als een badge kreukt of
zoekraakt.

Inchecken vanuit de bezoekerslijst print ook — mits de koppeling op die
laptop draait.

## Alternatief zonder installatie

Wil je niets installeren? Dubbelklik **`scripts/Badge Printer.command`** —
er opent een venster dat je gewoon open laat staan tijdens het event.

## Als er niet geprint wordt

1. Staat de printer aan en zit de USB-kabel erin?
2. Zie je onderin de scanpagina "Printer verbonden"? Zo niet: run de
   installatie opnieuw of dubbelklik `Badge Printer.command`.
3. Papier op / vastloper? De printer geeft dit zelf aan op het schermpje.
4. Logboek van de koppeling: `~/Library/Logs/badge-scan-print-agent.log`

**Belangrijk:** een printerprobleem blokkeert nooit het inchecken zelf.

## Techniek (voor de beheerder)

- Agent: `scripts/print-agent.mjs` — Node, geen dependencies, luistert
  uitsluitend op `127.0.0.1:9123` (niet bereikbaar van buitenaf).
- Print via CUPS: `lp -d EPSON_CW_C4000e -o media=Custom.96x271.3mm` (één pagina = één badge van 2 labels).
- Andere printer/queue? Zet env vars `PRINTER` en `MEDIA`.
- Verwijderen: `bash scripts/install-print-agent.sh --uninstall`
- Printerconfiguratie (media, knippen, formaat): zie het projectgeheugen of
  vraag het na — samengevat: ExpoBadge 260T fanfold via achterinvoer,
  gestanst etiket + gap-detectie, auto-cut na elke job, "Melding
  mediaformaat" uit.
