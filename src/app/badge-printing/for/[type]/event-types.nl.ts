import type { EventType } from "./event-types";

export const EVENT_TYPES_NL: Record<string, EventType> = {
  "trade-shows": {
    slug: "trade-shows",
    name: "Beurzen",
    nameLower: "beurzen",
    dutchKeyword: "beurzen",
    oneLiner:
      "On-demand bezoekersbadges voor beurzen en vakbeurzen — van CSV naar printer in enkele minuten.",
    description:
      "Beurzen betekenen onvoorspelbare walk-ins, last-minute standpersoneel en de noodzaak om er vanaf de eerste minuut verzorgd uit te zien. Badge Scan print duidelijke, gebrande bezoekersbadges bij de ingang — geen mail-merge de avond ervoor, geen voorgedrukte verspilling, geen spreadsheetacrobatiek. Gemaakt voor organisatoren van beurzen en B2B-expo's.",
    audience:
      "Gemaakt voor organisatoren van internationale vakbeurzen, regionale B2B-expo's en exposantgedreven beurzen in Nederland en daarbuiten.",
    scenarios: [
      "Internationale B2B-vakbeurzen",
      "Regionale branchebeurzen",
      "Exposanten- & bezoekersbadges uit één CSV",
      "Meerdaagse beurzen met dagelijkse herprints",
    ],
    whyBullets: [
      {
        title: "Walk-in-vriendelijk",
        body: "De helft van je bezoekers registreert zich bij de deur. Badge Scan behandelt ad-hocdeelnemers net als voorgeregistreerde: scan een QR of typ een barcode, print, klaar.",
      },
      {
        title: "Exposanten- + bezoekersbadges naast elkaar",
        body: "Draai twee evenementen in Badge Scan — één voor bezoekers, één voor standpersoneel — elk met een eigen ontwerp, deelnemerslijst en scannerpagina.",
      },
      {
        title: "Geen voorgedrukte verspilling",
        body: "Geen dozen ongebruikte badges meer na de beurs. Je print alleen badges voor bezoekers die daadwerkelijk binnenkomen.",
      },
    ],
    faq: [
      {
        q: "Kan Badge Scan 10.000+ beursbezoekers aan?",
        a: "Ja. CSV-imports worden server-side in batches verwerkt en de scanner doet per scan één index-lookup. Getest met 10k+ deelnemers en printtijden onder de seconde.",
      },
      {
        q: "Heb ik verschillende badges nodig voor bezoekers en exposanten?",
        a: "Ja — en dat kan met Badge Scan. Maak twee aparte evenementen aan (bijv. 'Vakbeurs 2026 — Bezoekers' en 'Vakbeurs 2026 — Exposanten'), elk met een eigen ontwerp en scannerstation.",
      },
      {
        q: "Wat als bezoekers zonder ticket binnenkomen?",
        a: "Voeg ze direct toe in Badge Scan met een eigen barcode (bijv. handmatig getypt of via een sticker-roll). De badge print uit zoals bij voorgeregistreerde bezoekers.",
      },
      {
        q: "Is Badge Scan geschikt voor meerdaagse beurzen?",
        a: "Zeker. De 'used_at'-markering houdt het inchecktijdstip bij, en badges kunnen opnieuw worden geprint zodra een bezoeker terugkomt. Voeg een dagpas-ontwerp toe voor beurzen die per dag nieuwe badges uitgeven.",
      },
    ],
  },
  conferences: {
    slug: "conferences",
    name: "Conferenties",
    nameLower: "conferenties",
    dutchKeyword: "conferenties",
    oneLiner:
      "Print conferentiebadges met bedrijf en functie uit je bestaande deelnemerslijst.",
    description:
      "Conferenties staan of vallen met een soepele incheck. Badge Scan houdt de rij in beweging: scan ticket, print badge, geef hem mee. De standaard vlinderbadge met naam, functie en bedrijf is wat professionele conferentiebezoekers verwachten — en je ontwerpt hem zonder designer. Voor conferenties van elke omvang.",
    audience:
      "Gebruikt door conferentieorganisatoren voor developersummits, fintech-events, zorgcongressen en bedrijfsoffsites.",
    scenarios: [
      "Tech- & developerconferenties",
      "Branchecongressen met VIP-sprekers",
      "Interne bedrijfsconferenties",
      "Professionele events met meerdere tracks",
    ],
    whyBullets: [
      {
        title: "Naam, functie, bedrijf — geregeld",
        body: "Deze vier velden zijn volwaardig in Badge Scan. De vlinderbadge toont ze in de indeling die conferentiebezoekers verwachten, met de juiste hiërarchie.",
      },
      {
        title: "Spreker- & VIP-badges",
        body: "Maak een tweede evenement in Badge Scan met een eigen ontwerp (andere achtergrondkleur, accentstreep). Zelfde workflow, ander uiterlijk.",
      },
      {
        title: "Vanaf minuut één professioneel",
        body: "Een strakke Epson ColorWorks C4000-badge zet de toon voor de dag. Bezoekers zien het verschil tussen een geprinte badge en een handgeschreven sticker.",
      },
    ],
    faq: [
      {
        q: "Welke informatie staat standaard op de badge?",
        a: "Standaard: voornaam, achternaam, functie en bedrijf. Optioneel: e-mailadres. Je kunt zelf per event aanvinken welke velden je wilt tonen.",
      },
      {
        q: "Kunnen deelnemers hun eigen conferentiebadge printen?",
        a: "Nee — Badge Scan is bewust organisatorgestuurd. Zo blijft de badge-indeling consistent en voorkom je misbruik (valse namen, eigen titels).",
      },
      {
        q: "Ondersteunt Badge Scan conferenties met meerdere tracks?",
        a: "Ja. Gebruik de deelnemers-CSV om track- of sessie-informatie in een eigen kolom te coderen en voeg die als extra veld toe aan het badge-ontwerp.",
      },
      {
        q: "Hoe snel kun je 200 conferentiebezoekers inchecken?",
        a: "Met één scanner en één C4000 print je circa 40 badges per minuut. Voor grotere conferenties: meerdere stations parallel — Badge Scan loopt op iedere browser-tab tegelijk.",
      },
    ],
  },
  events: {
    slug: "events",
    name: "Evenementen",
    nameLower: "evenementen",
    dutchKeyword: "evenementen",
    oneLiner:
      "Elk evenement, elke omvang — print deelnemersbadges on-demand uit je bestaande ticketlijst.",
    description:
      "Workshops, meetups, bedrijfsevenementen, awardshows, klantendagen, interne bedrijfsbijeenkomsten — overal waar deelnemers een naam op hun borst nodig hebben, regelt Badge Scan het. Geen nieuwe tools, geen nieuwe training, geen inrichting per evenement. Voor evenementen van elke grootte.",
    audience:
      "Vertrouwd door eventmanagers voor bedrijfsevenementen, workshops, awardshows, klantendagen en brandactivaties.",
    scenarios: [
      "Bedrijfsevenementen & klantendagen",
      "Workshops en trainingen",
      "Awardshows & galadiners",
      "Brandactivaties en lanceringen",
    ],
    whyBullets: [
      {
        title: "Opgezet in minder dan een minuut",
        body: "Maak een evenement aan, upload een CSV, ontwerp één keer. De hele flow kost minder tijd dan het bestellen van voorgedrukte badges.",
      },
      {
        title: "Ziet eruit als jouw merk, niet het onze",
        body: "Upload je logo, kies je merkkleuren en plaats eventueel een achtergrondafbeelding. Geen 'Powered by'-watermerk op de badge.",
      },
      {
        title: "Werkt op elke laptop + USB-scanner + C4000",
        body: "Geen app om te installeren, geen specifiek besturingssysteem. Heb je een browser, dan heb je Badge Scan. Neem de Epson C4000 mee die je locatie of AV-partner al levert.",
      },
    ],
    faq: [
      {
        q: "Is Badge Scan alleen voor grote evenementen?",
        a: "Nee. We hebben klanten die workshops van 20 personen draaien en conferenties van 5.000. De flow is hetzelfde — alleen het aantal printers verandert.",
      },
      {
        q: "Kan Badge Scan ook bij kleine evenementen worden gebruikt?",
        a: "Zeker. Voor kleine evenementen werkt het juist heel goed: één laptop, één scanner, één C4000, en je bent klaar. Geen overhead.",
      },
      {
        q: "Heb ik internet nodig op de locatie?",
        a: "Ja — de scanner bevraagt Badge Scan live zodat ingetrokken tickets ingetrokken blijven. Zorg dat je locatie stabiele wifi of een bekabelde verbinding heeft.",
      },
      {
        q: "Kan ik Badge Scan gebruiken voor terugkerende evenementen?",
        a: "Ja. Maak voor elke editie een nieuw evenement aan en importeer de deelnemers-CSV van die editie. Het ontwerp van vorig jaar hergebruiken kost een minuut — neem de kleuren over en upload het logo opnieuw.",
      },
    ],
  },
};
