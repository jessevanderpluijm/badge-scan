# Badges automatisch printen

Als je incheckt (via de scanner of de bezoekerslijst) print PrintBadges de badge
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
- Print via CUPS: `lp -d EPSON_CW_C4000e -o media=Custom.104x269mm -o fit-to-page=false`
  (één pagina = één badge van 2 labels; 104 mm = 96 mm label + 4 mm afloop
  per zijkant, 269 mm = 2 × 134 mm labels + 1 mm dode staart die achter de
  snede valt).
- Andere printer/queue? Zet env vars `PRINTER` en `MEDIA`.
- Verwijderen: `bash scripts/install-print-agent.sh --uninstall`
- CUPS-wachtrij (eenmalig): `lpadmin -p EPSON_CW_C4000e -o EPIJ_MdSv=0`
  — **mediabesparing moet uit**, anders print de kop de laatste ~9 mm van
  elke badge niet.
- Printerconfiguratie op het paneel (eenmalig):
  - Media vorm: gestanst etiket · detectie: gap · papier: mat
  - Media Settings → Media Size Notice: **Off**
  - Media Settings → Print Position Adjustment: **Top +2.5 mm / Left −0.5 mm**
    (kalibratiewaarden van onze printer; fijnslijpen met een testbadge)
  - Printer Settings → Print Options → Cut Position: **−1.0 mm** (compenseert
    de 1 mm extra paginalengte, zodat de snede exact op de perforatie valt)
- Media-model: ExpoBadge 260T fanfold via achterinvoer. De labels liggen
  **rug-aan-rug** (alleen een perforatie, géén 3 mm tussenruimte): 134 mm
  per label, badge = exact 268 mm.
