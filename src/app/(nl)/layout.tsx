import type { Metadata } from "next";
import { SITE_URL } from "@/lib/seo";
import "../globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Badge Scan — Badges printen voor evenementen & conferenties",
    template: "%s | Badge Scan",
  },
  description:
    "Self-serve incheck en on-demand badges printen voor conferenties, beurzen en netwerkevenementen. Upload een CSV, ontwerp één keer, scan en print aan de deur.",
  openGraph: {
    siteName: "Badge Scan",
    type: "website",
    locale: "nl_NL",
  },
  twitter: {
    card: "summary_large_image",
  },
};

export default function NlRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="nl">
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
