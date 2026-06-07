import type { Metadata } from "next";
import { SITE_URL } from "@/lib/seo";
import "../globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Badge Scan — On-demand event & conference badge printing",
    template: "%s | Badge Scan",
  },
  description:
    "Self-serve check-in and on-demand badge printing for conferences, trade shows and networking events. Upload a CSV, design once, scan and print at the door.",
  openGraph: {
    siteName: "Badge Scan",
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
