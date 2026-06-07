// Bilingual (English / Dutch) support for the marketing site.
//
// URL strategy: English lives at the root (no prefix), Dutch lives under /nl.
// Each locale has its own root layout (see src/app/(en) and src/app/(nl)) so
// the <html lang> attribute is correct per locale while pages stay static.

export const locales = ["en", "nl"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "en";

// Map a locale-agnostic path (the English/canonical path, e.g. "/" or
// "/badge-printing/weticket") to the URL for a given locale.
export function localePath(locale: Locale, path: string): string {
  if (locale === "en") return path;
  if (path === "/") return "/nl";
  return `/nl${path}`;
}

// Reciprocal hreflang map for Next.js metadata `alternates.languages`.
// Pass the locale-agnostic (English) path; metadataBase turns these absolute.
export function hreflangAlternates(path: string): Record<string, string> {
  return {
    en: localePath("en", path),
    nl: localePath("nl", path),
    "x-default": localePath("en", path),
  };
}

// Convenience: full `alternates` block (canonical + languages) for a page.
export function localeAlternates(locale: Locale, path: string) {
  return {
    canonical: localePath(locale, path),
    languages: hreflangAlternates(path),
  };
}

type Dictionary = {
  nav: { signIn: string; bookDemo: string; openDashboard: string };
  hero: { seeHow: string };
  finalCta: { heading: string; body: string; button: string };
  reviews: {
    badge: string;
    heading: string;
    intro: string;
    points: { title: string; body: string }[];
  };
  footer: {
    tagline: string;
    integrations: string;
    useCases: string;
    product: string;
    badgePrintingFor: (name: string) => string;
    signIn: string;
    bookDemo: string;
    copyright: string;
    madeFor: string;
  };
  langSwitch: { en: string; nl: string; label: string };
  demo: {
    title: string;
    intro: string;
    points: string[];
    form: {
      name: string;
      email: string;
      company: string;
      attendees: string;
      attendeesPlaceholder: string;
      message: string;
      messagePlaceholder: string;
      submit: string;
      sending: string;
      successHeading: string;
      successBody: string;
      alreadyCustomer: string;
      signIn: string;
    };
    meta: { title: string; description: string };
  };
  partnerPage: {
    backLink: string;
    bookDemo: string;
    howFlow: (name: string) => string;
    bullets: (name: string) => string[];
    flowLabel: (name: string) => string;
    exportTitle: (name: string) => string;
    mapTitle: string;
    designTitle: string;
    whyHeading: (name: string) => string;
    whySub: (name: string, origin: string) => string;
    faqHeading: (name: string) => string;
    faqSub: string;
    ctaHeading: (name: string) => string;
    ctaBody: (name: string) => string;
    metaTitle: (name: string) => string;
    metaDescription: (oneLiner: string) => string;
    keywords: (name: string) => string[];
  };
  eventTypePage: {
    backLink: string;
    seeHow: string;
    scenariosHeading: (nameLower: string) => string;
    scenariosSub: string;
    faqHeading: (name: string) => string;
    faqSub: (nameLower: string) => string;
    ctaHeading: (nameLower: string) => string;
    ctaBody: (nameLower: string) => string;
    metaTitle: (nameLower: string) => string;
    metaDescription: (
      oneLiner: string,
      nameLower: string,
      dutchKeyword: string,
    ) => string;
    keywords: (name: string, nameLower: string, dutchKeyword: string) => string[];
  };
};

export const dict: Record<Locale, Dictionary> = {
  en: {
    nav: {
      signIn: "Sign in",
      bookDemo: "Book a demo",
      openDashboard: "Open dashboard",
    },
    hero: { seeHow: "See how it works" },
    finalCta: {
      heading: "Skip the badge-printing headache.",
      body: "Book a demo and we'll show you check-in and on-demand badge printing end to end.",
      button: "Book a demo",
    },
    reviews: {
      badge: "Newly launched",
      heading: "No reviews to show off yet — here's the honest version.",
      intro:
        "Badge Scan is new, so we'd rather not fill this space with testimonials we don't have. Instead, here's what you can actually count on right now.",
      points: [
        {
          title: "You get the person who built it",
          body: "Badge Scan is run by one person, not a support queue. Email lands with the maker — questions get answered the same way they get fixed.",
        },
        {
          title: "Built around real export files",
          body: "It's shaped by the messy CSV exports ticketing platforms actually produce — odd headers, extra columns, mixed name fields and all.",
        },
        {
          title: "Set up at real events",
          body: "Designed hands-on for door check-in and on-demand printing — the parts that go wrong on the day are the parts it's built to survive.",
        },
      ],
    },
    footer: {
      tagline:
        "Print conference and event badges on demand. Bring any ticket platform.",
      integrations: "Integrations",
      useCases: "Use cases",
      product: "Product",
      badgePrintingFor: (name) => `Badge printing for ${name}`,
      signIn: "Sign in",
      bookDemo: "Book a demo",
      copyright: "Badge Scan",
      madeFor: "Made for conference and event organizers.",
    },
    langSwitch: { en: "EN", nl: "NL", label: "Language" },
    demo: {
      title: "Book a demo.",
      intro:
        "Tell us about your event and we'll walk you through check-in and on-demand badge printing with Badge Scan — and answer anything you need before your next event.",
      points: [
        "See the full CSV-to-printed-badge flow",
        "Works with your existing ticketing system",
        "Get pricing for your event size",
      ],
      form: {
        name: "Name",
        email: "Work email",
        company: "Company / organization",
        attendees: "Expected attendees",
        attendeesPlaceholder: "e.g. 250",
        message: "Anything we should know? (optional)",
        messagePlaceholder:
          "Type of event, ticketing system you use, questions…",
        submit: "Book a demo",
        sending: "Sending…",
        successHeading: "Thanks — we'll be in touch.",
        successBody:
          "We've received your request and will reach out shortly to set up your demo.",
        alreadyCustomer: "Already a customer?",
        signIn: "Sign in",
      },
      meta: {
        title: "Book a demo",
        description:
          "See how Badge Scan handles check-in and on-demand badge printing for your event. Tell us about your event and we'll set up a personal demo.",
      },
    },
    partnerPage: {
      backLink: "← All integrations",
      bookDemo: "Book a demo",
      howFlow: (name) => `How the ${name} flow works`,
      bullets: (name) => [
        `No ${name} integration setup`,
        "Print at the door on demand",
        "Compatible with any C4000 printer",
        "Personal onboarding",
      ],
      flowLabel: (name) => `${name} → Badge Scan → Printer`,
      exportTitle: (name) => `Export attendees from ${name}`,
      mapTitle: "Map columns in Badge Scan",
      designTitle: "Design & print",
      whyHeading: (name) =>
        `Why event organisers using ${name} pick Badge Scan`,
      whySub: (name, origin) =>
        `You already chose ${origin} for ticketing. Badge Scan only touches the badge step.`,
      faqHeading: (name) => `${name} badge printing — FAQ`,
      faqSub:
        "Everything event organisers usually ask before switching their badge flow to Badge Scan.",
      ctaHeading: (name) => `Ready to print ${name} badges?`,
      ctaBody: (name) =>
        `Book a demo and we'll walk you through the ${name} flow end to end — no integration required.`,
      metaTitle: (name) => `Badge printing for ${name}`,
      metaDescription: (oneLiner) =>
        `${oneLiner} Export attendees, design a badge, print at check-in on an Epson ColorWorks C4000.`,
      keywords: (name) => [
        `badge printing ${name}`,
        `${name} badge printing`,
        `${name} conference badges`,
        `${name} event badges`,
        "conference badge printing",
        "event badge printing",
        "Epson ColorWorks C4000",
      ],
    },
    eventTypePage: {
      backLink: "← Back to home",
      seeHow: "See how it fits",
      scenariosHeading: (nameLower) =>
        `Where Badge Scan fits in your ${nameLower}.`,
      scenariosSub:
        "Common scenarios where event organisers turn to Badge Scan instead of pre-printing or stickers.",
      faqHeading: (name) => `${name} badge printing — FAQ`,
      faqSub: (nameLower) =>
        `Questions event organisers ask before moving their ${nameLower} badge flow to Badge Scan.`,
      ctaHeading: (nameLower) =>
        `Print badges for your ${nameLower} the easy way.`,
      ctaBody: (nameLower) =>
        `Book a demo and see the full check-in and badge-printing flow for your ${nameLower}.`,
      metaTitle: (nameLower) => `Badge printing for ${nameLower}`,
      metaDescription: (oneLiner, nameLower, dutchKeyword) =>
        `${oneLiner} On-demand badge printing for ${nameLower} (${dutchKeyword}) — designed for the Epson ColorWorks C4000.`,
      keywords: (name, nameLower, dutchKeyword) => [
        `badge printing ${nameLower}`,
        `badge printing ${dutchKeyword}`,
        `${name} badge printing`,
        `${dutchKeyword} badges`,
        `${nameLower} check-in`,
        "Epson ColorWorks C4000",
        "on-demand badge printing",
      ],
    },
  },
  nl: {
    nav: {
      signIn: "Inloggen",
      bookDemo: "Demo aanvragen",
      openDashboard: "Naar dashboard",
    },
    hero: { seeHow: "Bekijk hoe het werkt" },
    finalCta: {
      heading: "Geen gedoe meer met badges printen.",
      body: "Vraag een demo aan en we laten je incheck én on-demand badges printen van begin tot eind zien.",
      button: "Demo aanvragen",
    },
    reviews: {
      badge: "Net gelanceerd",
      heading: "Nog geen reviews om mee te pronken — dit is de eerlijke versie.",
      intro:
        "Badge Scan is nieuw, dus we vullen deze plek liever niet met reviews die we niet hebben. In plaats daarvan: dit is waar je nú op kunt rekenen.",
      points: [
        {
          title: "Je hebt rechtstreeks contact met de maker",
          body: "Badge Scan wordt gerund door één persoon, geen supportwachtrij. Je mail komt bij de maker binnen — vragen worden net zo snel beantwoord als opgelost.",
        },
        {
          title: "Gebouwd rond echte exportbestanden",
          body: "Gevormd door de rommelige CSV-exports die ticketsystemen echt produceren — rare kolomnamen, extra kolommen, gemixte naamvelden en al.",
        },
        {
          title: "Getest op echte evenementen",
          body: "Hands-on ontworpen voor incheck aan de deur en on-demand printen — juist de dingen die op de dag zelf misgaan, zijn waar het tegen bestand is.",
        },
      ],
    },
    footer: {
      tagline:
        "Print badges voor conferenties en evenementen on demand. Werkt met elk ticketsysteem.",
      integrations: "Integraties",
      useCases: "Toepassingen",
      product: "Product",
      badgePrintingFor: (name) => `Badges printen voor ${name}`,
      signIn: "Inloggen",
      bookDemo: "Demo aanvragen",
      copyright: "Badge Scan",
      madeFor: "Gemaakt voor organisatoren van conferenties en evenementen.",
    },
    langSwitch: { en: "EN", nl: "NL", label: "Taal" },
    demo: {
      title: "Vraag een demo aan.",
      intro:
        "Vertel ons over je evenement en we lopen samen door incheck en on-demand badges printen met Badge Scan — en beantwoorden alles wat je wilt weten vóór je volgende evenement.",
      points: [
        "Zie de volledige flow van CSV tot geprinte badge",
        "Werkt met je bestaande ticketsysteem",
        "Krijg een prijs op maat van je evenement",
      ],
      form: {
        name: "Naam",
        email: "Zakelijk e-mailadres",
        company: "Bedrijf / organisatie",
        attendees: "Verwacht aantal bezoekers",
        attendeesPlaceholder: "bijv. 250",
        message: "Iets wat we moeten weten? (optioneel)",
        messagePlaceholder:
          "Type evenement, welk ticketsysteem je gebruikt, vragen…",
        submit: "Demo aanvragen",
        sending: "Versturen…",
        successHeading: "Bedankt — we nemen contact op.",
        successBody:
          "We hebben je aanvraag ontvangen en nemen snel contact op om je demo in te plannen.",
        alreadyCustomer: "Al klant?",
        signIn: "Inloggen",
      },
      meta: {
        title: "Demo aanvragen",
        description:
          "Ontdek hoe Badge Scan incheck en on-demand badges printen voor jouw evenement regelt. Vertel ons over je evenement en we zetten een persoonlijke demo voor je klaar.",
      },
    },
    partnerPage: {
      backLink: "← Alle integraties",
      bookDemo: "Demo aanvragen",
      howFlow: (name) => `Hoe de ${name}-flow werkt`,
      bullets: (name) => [
        `Geen ${name}-integratie opzetten`,
        "Print on demand aan de deur",
        "Werkt met elke C4000-printer",
        "Persoonlijke onboarding",
      ],
      flowLabel: (name) => `${name} → Badge Scan → Printer`,
      exportTitle: (name) => `Exporteer bezoekers uit ${name}`,
      mapTitle: "Koppel kolommen in Badge Scan",
      designTitle: "Ontwerp & print",
      whyHeading: (name) =>
        `Waarom organisatoren met ${name} voor Badge Scan kiezen`,
      whySub: (name, origin) =>
        `Je koos al voor ${origin} voor ticketing. Badge Scan raakt alleen de badge-stap aan.`,
      faqHeading: (name) => `Badges printen voor ${name} — veelgestelde vragen`,
      faqSub:
        "Alles wat organisatoren meestal vragen voordat ze hun badge-flow naar Badge Scan verhuizen.",
      ctaHeading: (name) => `Klaar om ${name}-badges te printen?`,
      ctaBody: (name) =>
        `Vraag een demo aan en we lopen de ${name}-flow van begin tot eind met je door — geen integratie nodig.`,
      metaTitle: (name) => `Badges printen voor ${name}`,
      metaDescription: (oneLiner) =>
        `${oneLiner} Exporteer bezoekers, ontwerp een badge en print bij de incheck op een Epson ColorWorks C4000.`,
      keywords: (name) => [
        `badges printen ${name}`,
        `${name} badges printen`,
        `${name} conferentiebadges`,
        `${name} evenementbadges`,
        "conferentiebadges printen",
        "evenementbadges printen",
        "Epson ColorWorks C4000",
      ],
    },
    eventTypePage: {
      backLink: "← Terug naar home",
      seeHow: "Bekijk hoe het past",
      scenariosHeading: (nameLower) =>
        `Waar Badge Scan past bij jouw ${nameLower}.`,
      scenariosSub:
        "Veelvoorkomende situaties waarin organisatoren voor Badge Scan kiezen in plaats van voorprinten of stickers.",
      faqHeading: (name) => `Badges printen voor ${name} — veelgestelde vragen`,
      faqSub: (nameLower) =>
        `Vragen die organisatoren stellen voordat ze hun badge-flow voor ${nameLower} naar Badge Scan verhuizen.`,
      ctaHeading: (nameLower) =>
        `Print badges voor je ${nameLower} op de makkelijke manier.`,
      ctaBody: (nameLower) =>
        `Vraag een demo aan en zie de volledige incheck- en badge-flow voor je ${nameLower}.`,
      metaTitle: (nameLower) => `Badges printen voor ${nameLower}`,
      metaDescription: (oneLiner, nameLower, dutchKeyword) =>
        `${oneLiner} On-demand badges printen voor ${nameLower} (${dutchKeyword}) — ontworpen voor de Epson ColorWorks C4000.`,
      keywords: (name, nameLower, dutchKeyword) => [
        `badges printen ${nameLower}`,
        `badges printen ${dutchKeyword}`,
        `${name} badges printen`,
        `${dutchKeyword} badges`,
        `${nameLower} incheck`,
        "Epson ColorWorks C4000",
        "on-demand badges printen",
      ],
    },
  },
};
