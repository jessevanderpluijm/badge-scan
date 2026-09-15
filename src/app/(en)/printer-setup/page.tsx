import type { Metadata } from "next";
import Link from "next/link";
import { ScanLine } from "lucide-react";
import { SetupGuide } from "./setup-guide";

export const metadata: Metadata = {
  title: "Printer installeren",
  description:
    "Stap-voor-stap handleiding om de Epson ColorWorks C4000e klaar te maken voor badge printing met PrintBadges — met live controles per stap.",
  robots: { index: false },
};

export default function PrinterSetupPage() {
  return (
    <div className="min-h-screen bg-muted/30">
      <header className="border-b bg-background">
        <div className="container flex h-14 items-center">
          <Link href="/" className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-md bg-primary flex items-center justify-center">
              <ScanLine className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-semibold tracking-tight">PrintBadges</span>
          </Link>
        </div>
      </header>

      <main className="container max-w-2xl py-10 space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Printer installeren
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            In vijf stappen klaar om badges te printen. Doe dit op de laptop
            waar de printer aan komt te hangen.
          </p>
        </div>
        <SetupGuide />
      </main>
    </div>
  );
}
