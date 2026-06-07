import type { Partner } from "./partners";

export const PARTNERS_NL: Record<string, Partner> = {
  weticket: {
    slug: "weticket",
    name: "WeTicket",
    origin: "het Nederlandse ticketplatform",
    oneLiner:
      "Print conferentie- en evenementbadges uit je WeTicket-deelnemerslijst — zonder iets te veranderen aan hoe je tickets verkoopt.",
    description:
      "Badge Scan leest je WeTicket-deelnemers-CSV in, laat je in de browser een professionele badge ontwerpen en print on-demand bij de deur op een Epson ColorWorks C4000. Geen nieuwe ticketsoftware om te leren, geen koppelingen om te onderhouden.",
    exportSteps: [
      "Open in WeTicket het evenement en ga naar de deelnemerslijst.",
      "Gebruik de exportoptie en kies CSV. Neem naam, e-mail en eventuele eigen velden mee die je hebt uitgevraagd (bedrijf, functie).",
      "Sleep de CSV in Badge Scan. Koppel de kolommen één keer — voornaam, achternaam, bedrijf, functie. We herkennen Nederlandse koppen als 'Voornaam' en 'Achternaam' automatisch.",
    ],
    whyBullets: [
      {
        title: "Geen overstap nodig",
        body: "Blijf gewoon tickets verkopen via WeTicket. Badge Scan regelt alleen de badge-stap op de dag zelf.",
      },
      {
        title: "Print bij de deur",
        body: "Scan een WeTicket-barcode en de bijbehorende badge print direct uit op je Epson C4000. Geen handmatig zoekwerk.",
      },
      {
        title: "Gemaakt voor Nederlandse evenementen",
        body: "De kopherkenning werkt op Nederlandse kolomnamen. Het vlinderformaat van 96 × 82 mm is wat de meeste Nederlandse conferentielocaties op voorraad hebben.",
      },
    ],
    faq: [
      {
        q: "Heb ik een WeTicket-koppeling nodig?",
        a: "Nee. Badge Scan leest simpelweg je WeTicket-deelnemers-CSV in — hetzelfde bestand dat je nu al uit je WeTicket-dashboard kunt downloaden.",
      },
      {
        q: "Welke printer werkt met WeTicket-badges via Badge Scan?",
        a: "Elke printer die PDF's op exacte mm-maten accepteert. We ontwerpen en testen op de Epson ColorWorks C4000 — de standaard voor on-demand evenementbadges.",
      },
      {
        q: "Kan ik WeTicket-barcodes bij de ingang scannen?",
        a: "Ja. Sluit een willekeurige USB-barcodescanner aan op je laptop, richt hem op de WeTicket-QR of Code 128 op het ticket van de bezoeker, en Badge Scan print de bijbehorende badge in minder dan een seconde.",
      },
      {
        q: "Slaat Badge Scan mijn WeTicket-deelnemersdata op?",
        a: "Alleen binnen je eigen, afgeschermde Badge Scan-account, beveiligd met row-level security. We delen nooit data en je kunt een evenement (en alle deelnemers) met één klik verwijderen.",
      },
    ],
  },
  weeztix: {
    slug: "weeztix",
    name: "Weeztix",
    origin: "het Europese ticketplatform",
    oneLiner:
      "Print badges voor je Weeztix-evenement zonder spreadsheets, mail-merges of voorgedrukte stickers.",
    description:
      "Weeztix krijgt je bezoekers binnen. Badge Scan zorgt voor hun badge. Exporteer je Weeztix-deelnemers als CSV, ontwerp de badge één keer en print on-demand bij de incheck op je Epson ColorWorks C4000.",
    exportSteps: [
      "Open in Weeztix het deelnemersoverzicht van je evenement.",
      "Exporteer de deelnemers als CSV. Neem voornaam, achternaam en e-mail mee — én eventuele extra checkoutvragen zoals bedrijf of functie.",
      "Upload de CSV in Badge Scan, koppel de kolommen, en je bent klaar om te scannen-en-printen.",
    ],
    whyBullets: [
      {
        title: "Gebouwd voor festivalvolume",
        body: "Of je Weeztix-evenement nu 50 of 5.000 deelnemers heeft: genereer vooraf alle badges in één PDF, of print ze stuk voor stuk bij de deur.",
      },
      {
        title: "Werkt direct met Weeztix-barcodes",
        body: "Code 128-barcodes van Weeztix-tickets scannen probleemloos in Badge Scan — zowel bij de incheck als voor bulkverwerking.",
      },
      {
        title: "Strakke standaardsjablonen",
        body: "Plaats je evenementlogo, kies je merkkleuren, en de live preview laat precies zien wat er uit de printer komt.",
      },
    ],
    faq: [
      {
        q: "Is Badge Scan een Weeztix add-on?",
        a: "Nee — Badge Scan is een losstaande tool. Hij werkt toevallig naadloos met het CSV-formaat dat Weeztix al exporteert.",
      },
      {
        q: "Kan ik Weeztix-badges in bulk printen vóór het evenement?",
        a: "Ja. Klik na het importeren van je Weeztix-CSV op 'Download alles' in de badge-ontwerper en je krijgt één PDF met elke badge op een aparte pagina — klaar voor de Epson ColorWorks C4000.",
      },
      {
        q: "Wat als een bezoeker niet in mijn Weeztix-lijst staat?",
        a: "Badge Scan toont een duidelijk 'Ongeldige barcode'-resultaat bij de scanner. Werk je lijst bij in Weeztix, exporteer de CSV opnieuw en upload hem — dubbele records worden automatisch overgeslagen.",
      },
      {
        q: "Rekent Weeztix extra kosten voor het gebruik van Badge Scan?",
        a: "Nee. Er komt geen API-koppeling aan te pas — alleen een CSV-export, die in elk Weeztix-abonnement zit.",
      },
    ],
  },
  paylogic: {
    slug: "paylogic",
    name: "Paylogic",
    origin: "het internationale eventticketplatform",
    oneLiner:
      "Print conferentiebadges uit je Paylogic-deelnemersdata zonder ook maar één regel code te schrijven.",
    description:
      "Paylogic verzorgt de ticketing voor grote internationale evenementen. Badge Scan verzorgt het badges printen — ontworpen, bekeken en geprint vanuit de browser. Exporteer je Paylogic-deelnemers-CSV, ontwerp één keer, print er duizenden.",
    exportSteps: [
      "Open in het Paylogic-dashboard het evenement en selecteer het deelnemersrapport.",
      "Download als CSV. Neem de naamvelden mee plus eventuele eigen registratievragen (bedrijf, functie, land).",
      "Upload naar Badge Scan. De kolomkoppeling herkent standaard Paylogic-exportkoppen automatisch.",
    ],
    whyBullets: [
      {
        title: "Opschalen zonder workflows te herbouwen",
        body: "Of je nu één of dertig evenementen per jaar organiseert: de flow blijft hetzelfde — exporteer uit Paylogic, sleep in Badge Scan, print.",
      },
      {
        title: "Klaar voor meerdere evenementen",
        body: "Elk evenement in Badge Scan heeft een eigen deelnemerslijst, ontwerp en scannerpagina — geen risico dat badges tussen evenementen door elkaar lopen.",
      },
      {
        title: "Printperfecte output",
        body: "PDF's worden gegenereerd op exact 96 × 82 mm of 90 × 55 mm, klaar voor de Epson ColorWorks C4000 zonder enige schaling.",
      },
    ],
    faq: [
      {
        q: "Heb ik IT nodig om een Paylogic-koppeling op te zetten?",
        a: "Nee. Badge Scan leest een standaard Paylogic-CSV-export — geen API-sleutel, geen webhooks, geen koppeling om in te richten.",
      },
      {
        q: "Kan ik badges per Paylogic-tickettype aanpassen?",
        a: "Op dit moment is het badge-ontwerp per evenement. Heb je ontwerpen per tickettype nodig (bijv. VIP versus algemene toegang)? Laat het ons weten, dan zetten we het hoger op de planning.",
      },
      {
        q: "Kan Badge Scan 10.000+ deelnemers uit Paylogic aan?",
        a: "Ja. CSV-imports worden in batches van 500 verwerkt en unieke-barcoderegels voorkomen dubbelingen, zodat zelfs zeer grote Paylogic-exports schoon importeren.",
      },
      {
        q: "Heeft Badge Scan internet nodig bij de deur?",
        a: "Ja — de scanner bevraagt je Badge Scan-account live, zodat ingetrokken Paylogic-tickets ingetrokken blijven. Zorg dat je locatie een stabiele wifi- of ethernetverbinding heeft.",
      },
    ],
  },
  momice: {
    slug: "momice",
    name: "Momice",
    origin: "het Nederlandse evenementregistratieplatform",
    oneLiner:
      "Zet je Momice-registraties in enkele minuten om in geprinte conferentiebadges.",
    description:
      "Momice verzorgt de registraties en communicatie voor je conferentie. Badge Scan voegt het on-demand badges printen toe. Exporteer je Momice-deelnemers, ontwerp de badge één keer en print op de dag zelf op een Epson ColorWorks C4000.",
    exportSteps: [
      "Open in Momice je evenement en ga naar de deelnemerslijst.",
      "Exporteer als CSV. Zorg dat je de velden naam, e-mail, bedrijf en functie meeneemt als je die hebt uitgevraagd.",
      "Sleep het bestand in Badge Scan. Koppel de Momice-kolommen — veelvoorkomende Nederlandse koppen als 'Voornaam', 'Achternaam', 'Bedrijf' en 'Functie' worden automatisch herkend.",
    ],
    whyBullets: [
      {
        title: "Complete Nederlandse conferentieflow",
        body: "Momice voor registraties, Badge Scan voor badges printen — samen dek je alles van aanmelding tot incheck, zonder extra tooling.",
      },
      {
        title: "Bedrijf + Functie standaard ondersteund",
        body: "De meeste Momice-evenementen vragen bedrijf en functie uit. Badge Scan heeft deze als volwaardige velden op de badge én in de deelnemerslijst.",
      },
      {
        title: "Last-minute walk-ins geregeld",
        body: "Voeg een losse deelnemer met een eigen barcode rechtstreeks in Badge Scan toe — geen omweg via Momice nodig voor last-minute registraties.",
      },
    ],
    faq: [
      {
        q: "Is er een officiële Momice + Badge Scan-koppeling?",
        a: "Nog niet — maar je hebt hem niet nodig. De Momice-CSV-export bevat alles wat Badge Scan nodig heeft.",
      },
      {
        q: "Welke Momice-velden kan ik op de badge printen?",
        a: "Elk van: voornaam, achternaam, bedrijf, functie en e-mail. Kies per evenement welke velden op de badge verschijnen.",
      },
      {
        q: "Kunnen deelnemers hun eigen Momice-badge printen?",
        a: "Nee — Badge Scan is gemaakt voor gecontroleerd, organisatorgestuurd printen op de locatie met een Epson ColorWorks C4000. Zo blijven badges consistent en voorkom je misbruik.",
      },
      {
        q: "Vervangt Badge Scan Momice?",
        a: "Nee. Badge Scan doet alleen de badge-stap. Blijf Momice gebruiken voor registraties, uitnodigingen en communicatie.",
      },
    ],
  },
};
