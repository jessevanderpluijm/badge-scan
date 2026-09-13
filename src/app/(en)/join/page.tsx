import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { ScanLine } from "lucide-react";
import { JoinFlow } from "./join-flow";

export const metadata: Metadata = {
  title: "Uitnodiging",
  robots: { index: false },
};

export default function JoinPage() {
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
      <main className="container max-w-md py-16">
        <Suspense>
          <JoinFlow />
        </Suspense>
      </main>
    </div>
  );
}
