import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Badge Scan",
  description: "Event check-in & barcode validation",
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
