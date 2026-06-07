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
  },
};
