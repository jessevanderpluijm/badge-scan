export type EventType = {
  slug: string;
  name: string;
  nameLower: string;
  dutchKeyword: string;
  oneLiner: string;
  description: string;
  audience: string;
  scenarios: string[];
  whyBullets: { title: string; body: string }[];
  faq: { q: string; a: string }[];
};

export const EVENT_TYPES: Record<string, EventType> = {
  "trade-shows": {
    slug: "trade-shows",
    name: "Trade shows",
    nameLower: "trade shows",
    dutchKeyword: "beurzen",
    oneLiner:
      "On-demand visitor badges for trade shows and trade fairs — from CSV to printer in minutes.",
    description:
      "Trade shows mean unpredictable walk-ins, last-minute exhibitor staff, and the need to look polished from the first minute the doors open. Badge Scan prints clear, branded visitor badges at the entrance — no day-before mail-merge, no pre-printed waste, no spreadsheet acrobatics. Designed for organisers of beurzen and B2B expos.",
    audience:
      "Built for organisers of international trade fairs, regional B2B expos, and exhibitor-driven shows in the Netherlands and beyond.",
    scenarios: [
      "International B2B trade fairs",
      "Regional industry exhibitions",
      "Exhibitor & visitor badges from one CSV",
      "Multi-day shows with daily re-prints",
    ],
    whyBullets: [
      {
        title: "Walk-in friendly",
        body: "Half your visitors will register at the door. Badge Scan handles ad-hoc attendees the same way as pre-registered ones — scan a QR or type a barcode, print, done.",
      },
      {
        title: "Exhibitor + visitor badges side by side",
        body: "Run two events in Badge Scan — one for visitors, one for exhibitor staff — each with its own design, attendee list, and scanner page.",
      },
      {
        title: "Zero pre-print waste",
        body: "No more boxes of unused badges after the show. You only print badges for visitors who actually walk in.",
      },
    ],
    faq: [
      {
        q: "Can Badge Scan handle 10,000+ trade show visitors?",
        a: "Yes. CSV imports are batched server-side and the scanner runs on a single index lookup per scan. Tested at 10k+ attendees with sub-second print times.",
      },
      {
        q: "Do I need different badges for visitors and exhibitors?",
        a: "Yes — and Badge Scan lets you. Create two separate events (e.g. 'Trade Fair 2026 — Visitors' and 'Trade Fair 2026 — Exhibitors'), each with its own design and scanner station.",
      },
      {
        q: "Wat als bezoekers zonder ticket binnenkomen?",
        a: "Voeg ze direct toe in Badge Scan met een eigen barcode (bijv. handmatig getypt of via een sticker-roll). De badge print uit zoals bij voorgeregistreerde bezoekers.",
      },
      {
        q: "Is Badge Scan suitable for multi-day trade shows?",
        a: "Definitely. The 'used_at' flag tracks check-in time, and badges can be re-printed any time a visitor returns. Add a daily-pass design for shows that re-issue badges per day.",
      },
    ],
  },
  conferences: {
    slug: "conferences",
    name: "Conferences",
    nameLower: "conferences",
    dutchKeyword: "conferenties",
    oneLiner:
      "Print conference badges with company and function from your existing attendee list.",
    description:
      "Conferences live and die by smooth check-in. Badge Scan keeps the queue moving: scan ticket, print badge, hand it over. The default butterfly badge with name, function and company is what professional conference attendees expect — and you can design it without a designer. For conferenties of any size.",
    audience:
      "Used by conference producers running developer summits, fintech events, healthcare conferences, and corporate offsites.",
    scenarios: [
      "Tech & developer conferences",
      "Industry summits with VIP speakers",
      "Corporate internal conferences",
      "Multi-track professional events",
    ],
    whyBullets: [
      {
        title: "Name, function, company — done",
        body: "These four fields are first-class in Badge Scan. The butterfly badge shows them in the layout conference attendees expect, with the right hierarchy.",
      },
      {
        title: "Speaker & VIP badges",
        body: "Create a second event in Badge Scan with a distinct design (different background colour, accent stripe). Use the same workflow, different visual.",
      },
      {
        title: "Look professional from minute one",
        body: "A crisp Epson ColorWorks C4000 badge sets the tone for the day. Attendees notice the difference between a printed badge and a hand-written sticker.",
      },
    ],
    faq: [
      {
        q: "Welke informatie staat standaard op de badge?",
        a: "Standaard: voornaam, achternaam, functie en bedrijf. Optioneel: e-mailadres. Je kunt zelf per event aanvinken welke velden je wilt tonen.",
      },
      {
        q: "Can attendees print their own conference badge?",
        a: "No — Badge Scan is organiser-driven by design. This keeps the badge layout consistent and prevents abuse (fake names, custom titles).",
      },
      {
        q: "Does Badge Scan support multi-track conferences?",
        a: "Yes. Use the attendee CSV to encode track or session info in a custom column, then add it to the badge design as an extra field.",
      },
      {
        q: "Hoe snel kun je 200 conferentiebezoekers inchecken?",
        a: "Met één scanner en één C4000 print je circa 40 badges per minuut. Voor grotere conferenties: meerdere stations parallel — Badge Scan loopt op iedere browser-tab tegelijk.",
      },
    ],
  },
  events: {
    slug: "events",
    name: "Events",
    nameLower: "events",
    dutchKeyword: "evenementen",
    oneLiner:
      "Any event, any size — print attendee badges on demand from your existing ticket list.",
    description:
      "Workshops, meetups, corporate events, awards nights, customer days, internal company gatherings — wherever attendees need a name on their chest, Badge Scan handles it. No new tools, no new training, no per-event setup. Voor evenementen van elke grootte.",
    audience:
      "Trusted by event managers running corporate events, workshops, awards nights, customer days, and brand activations.",
    scenarios: [
      "Corporate events & customer days",
      "Workshops and training sessions",
      "Awards nights & gala dinners",
      "Brand activations and launches",
    ],
    whyBullets: [
      {
        title: "Setup in under a minute",
        body: "Create an event, upload a CSV, design once. The whole flow takes less time than ordering pre-printed badges.",
      },
      {
        title: "Looks like your brand, not ours",
        body: "Upload your logo, pick brand colours, optionally drop a background image. No 'Powered by' watermark on the badge.",
      },
      {
        title: "Works on any laptop + USB scanner + C4000",
        body: "No app to install, no specific OS. If you have a browser, you have Badge Scan. Bring the Epson C4000 your venue or AV partner already supplies.",
      },
    ],
    faq: [
      {
        q: "Is Badge Scan only for large events?",
        a: "No. We have customers running 20-person workshops and 5,000-person conferences. The flow is the same — only the printer count changes.",
      },
      {
        q: "Kan Badge Scan ook bij kleine evenementen worden gebruikt?",
        a: "Zeker. Voor kleine evenementen werkt het juist heel goed: één laptop, één scanner, één C4000, en je bent klaar. Geen overhead.",
      },
      {
        q: "Do I need internet at the venue?",
        a: "Yes — the scanner queries Badge Scan live so revoked tickets stay revoked. Make sure your venue has stable wifi or a wired connection.",
      },
      {
        q: "Can I use Badge Scan for recurring events?",
        a: "Yes. Create a new event for each edition and re-import that edition's attendee CSV. Re-using last year's badge design takes a minute — copy the colours and re-upload the logo.",
      },
    ],
  },
};
