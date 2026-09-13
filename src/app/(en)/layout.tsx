import type { Metadata } from "next";
import { SITE_URL } from "@/lib/seo";
import "../globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "PrintBadges — On-demand event & conference badge printing",
    template: "%s | PrintBadges",
  },
  description:
    "Self-serve check-in and on-demand badge printing for conferences, trade shows and networking events. Upload a CSV, design once, scan and print at the door.",
  openGraph: {
    siteName: "PrintBadges",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
