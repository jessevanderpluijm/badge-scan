export type Partner = {
  slug: string;
  name: string;
  origin: string;
  oneLiner: string;
  description: string;
  exportSteps: string[];
  whyBullets: { title: string; body: string }[];
  faq: { q: string; a: string }[];
};

export const PARTNERS: Record<string, Partner> = {
  weticket: {
    slug: "weticket",
    name: "WeTicket",
    origin: "the Dutch ticketing platform",
    oneLiner:
      "Print conference and event badges from your WeTicket attendee list — without changing how you sell tickets.",
    description:
      "Badge Scan reads your WeTicket attendee CSV, lets you design a professional badge in a browser, and prints on demand at the door on an Epson ColorWorks C4000. No new ticketing software to learn, no integrations to maintain.",
    exportSteps: [
      "In WeTicket, open the event and head to the attendee list.",
      "Use the export option and pick CSV. Include name, email and any custom fields you collected (company, function).",
      "Drop the CSV into Badge Scan. Map columns once — first name, last name, company, function. We auto-detect Dutch headers like 'Voornaam' and 'Achternaam'.",
    ],
    whyBullets: [
      {
        title: "No re-platforming",
        body: "Keep selling tickets in WeTicket. Badge Scan only handles the badge step on the day itself.",
      },
      {
        title: "Print at the door",
        body: "Scan a WeTicket barcode, the matching badge prints instantly on your Epson C4000. No manual lookup.",
      },
      {
        title: "Designed for Dutch events",
        body: "Header detection works on Dutch column names. The 96 × 82 mm butterfly format is what most Dutch conference venues stock.",
      },
    ],
    faq: [
      {
        q: "Do I need a WeTicket integration?",
        a: "No. Badge Scan just reads your WeTicket attendee CSV export — the same file you can already download from your WeTicket dashboard.",
      },
      {
        q: "Which printer works with WeTicket badges via Badge Scan?",
        a: "Any printer that accepts PDF input at exact mm dimensions. We design and test against the Epson ColorWorks C4000 — the industry standard for on-demand event badges.",
      },
      {
        q: "Can I scan WeTicket barcodes at the entrance?",
        a: "Yes. Plug any USB barcode scanner into your laptop, point it at the WeTicket QR or Code 128 on the visitor's ticket, and Badge Scan prints the matching badge in under a second.",
      },
      {
        q: "Does Badge Scan store my WeTicket attendee data?",
        a: "Only inside your own private Badge Scan account, protected by row-level security. We never share data and you can delete an event (and all its attendees) with one click.",
      },
    ],
  },
  weeztix: {
    slug: "weeztix",
    name: "Weeztix",
    origin: "the European ticketing platform",
    oneLiner:
      "Print badges for your Weeztix event without spreadsheets, mail-merges, or pre-printed stickers.",
    description:
      "Weeztix gets your visitors in. Badge Scan gets them badged. Export your Weeztix attendees as a CSV, design the badge once, then print on demand at check-in on your Epson ColorWorks C4000.",
    exportSteps: [
      "In Weeztix, open your event's attendees view.",
      "Export attendees as CSV. Include first name, last name, email — and any custom checkout questions like company or function.",
      "Upload the CSV into Badge Scan, map columns, and you're ready to scan-and-print.",
    ],
    whyBullets: [
      {
        title: "Built for festival-scale volume",
        body: "Whether your Weeztix event has 50 attendees or 5,000, batch-generate every badge as a single PDF up front, or print one-by-one at the door.",
      },
      {
        title: "Works with Weeztix barcodes out of the box",
        body: "Code 128 barcodes from Weeztix tickets scan correctly into Badge Scan — both at check-in and for bulk lookup.",
      },
      {
        title: "Beautiful default templates",
        body: "Drop your event logo, pick brand colors, and the live preview tells you exactly what comes out of the printer.",
      },
    ],
    faq: [
      {
        q: "Is Badge Scan a Weeztix add-on?",
        a: "No — Badge Scan is a standalone tool. It just happens to work seamlessly with the CSV format Weeztix already exports.",
      },
      {
        q: "Can I print Weeztix badges in bulk before the event?",
        a: "Yes. After importing your Weeztix CSV, click 'Download all' in the badge designer and you get a single PDF with every badge as a separate page — ready for the Epson ColorWorks C4000.",
      },
      {
        q: "What if a visitor isn't in my Weeztix list?",
        a: "Badge Scan shows a clear 'Invalid barcode' result at the scanner. Update your list in Weeztix, re-export the CSV, and re-upload — duplicates are skipped automatically.",
      },
      {
        q: "Does Weeztix charge extra for using Badge Scan?",
        a: "No. There's no API integration involved — just a CSV export, which is included in every Weeztix plan.",
      },
    ],
  },
  paylogic: {
    slug: "paylogic",
    name: "Paylogic",
    origin: "the international event ticketing platform",
    oneLiner:
      "Print conference badges from your Paylogic attendee data without writing a single line of code.",
    description:
      "Paylogic handles ticketing for major international events. Badge Scan handles the badge printing — designed, previewed, and printed from a browser. Export your Paylogic attendee CSV, design once, print thousands.",
    exportSteps: [
      "From the Paylogic dashboard, open the event and select the attendee report.",
      "Download as CSV. Include name fields plus any custom registration questions (company, function, country).",
      "Upload to Badge Scan. The column mapper auto-detects standard Paylogic export headers.",
    ],
    whyBullets: [
      {
        title: "Scale without rebuilding workflows",
        body: "Whether you organise one event or thirty per year, the flow stays the same: export from Paylogic, drop into Badge Scan, print.",
      },
      {
        title: "Multi-event ready",
        body: "Each event in Badge Scan has its own attendee list, design and scanner page — no risk of badges crossing events.",
      },
      {
        title: "Print-perfect output",
        body: "PDFs are generated at exact 96 × 82 mm or 90 × 55 mm dimensions, ready for the Epson ColorWorks C4000 with zero scaling.",
      },
    ],
    faq: [
      {
        q: "Do I need IT to set up a Paylogic integration?",
        a: "No. Badge Scan reads a standard Paylogic CSV export — no API key, no webhooks, no integration setup.",
      },
      {
        q: "Can I customise badges per Paylogic ticket type?",
        a: "Today the badge design is per event. If you need per-ticket-type designs (e.g. VIP vs general admission), let us know and we'll prioritise it.",
      },
      {
        q: "Will Badge Scan handle 10,000+ attendees from Paylogic?",
        a: "Yes. CSV imports are chunked into batches of 500 and unique-barcode constraints prevent duplicates, so even very large Paylogic exports import cleanly.",
      },
      {
        q: "Does Badge Scan need internet at the door?",
        a: "Yes — the scanner queries your Badge Scan account live so that revoked Paylogic tickets stay revoked. Make sure your venue has a stable wifi or ethernet connection.",
      },
    ],
  },
  momice: {
    slug: "momice",
    name: "Momice",
    origin: "the Dutch event registration platform",
    oneLiner:
      "Turn your Momice registrations into printed conference badges in minutes.",
    description:
      "Momice handles registrations and communication for your conference. Badge Scan adds the on-demand badge printing. Export your Momice attendees, design the badge once, print on the day on an Epson ColorWorks C4000.",
    exportSteps: [
      "In Momice, open your event and go to the participants list.",
      "Export as CSV. Be sure to include name, email, company and function fields if you've collected them.",
      "Drop the file into Badge Scan. Map the Momice columns — common Dutch headers like 'Voornaam', 'Achternaam', 'Bedrijf' and 'Functie' are auto-recognised.",
    ],
    whyBullets: [
      {
        title: "End-to-end Dutch conference flow",
        body: "Momice for registrations, Badge Scan for badge printing — together you cover everything from sign-up to check-in without extra tooling.",
      },
      {
        title: "Bedrijf + Functie supported out of the box",
        body: "Most Momice events collect company and function. Badge Scan has these as first-class fields on the badge and in the attendee list.",
      },
      {
        title: "Last-minute walk-ins handled",
        body: "Add a one-off attendee with a custom barcode straight in Badge Scan — no need to round-trip through Momice for last-minute registrations.",
      },
    ],
    faq: [
      {
        q: "Is there an official Momice + Badge Scan integration?",
        a: "Not yet — but you don't need one. The Momice CSV export contains everything Badge Scan needs.",
      },
      {
        q: "Which Momice fields can I print on the badge?",
        a: "Any of: first name, last name, company, function, and email. Pick which ones show on the badge per event.",
      },
      {
        q: "Can attendees print their own Momice badge?",
        a: "No — Badge Scan is built for organiser-driven, controlled printing at the venue with an Epson ColorWorks C4000. This keeps badges consistent and prevents abuse.",
      },
      {
        q: "Does Badge Scan replace Momice?",
        a: "No. Badge Scan only does the badge step. Keep using Momice for registrations, invitations and communication.",
      },
    ],
  },
};
