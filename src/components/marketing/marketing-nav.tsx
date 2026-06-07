import Link from "next/link";
import { ScanLine } from "lucide-react";
import { NavAuthButtons } from "@/components/marketing/auth-cta";

export function MarketingNav() {
  return (
    <header className="border-b">
      <div className="container flex h-14 items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-md bg-primary flex items-center justify-center">
            <ScanLine className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="font-semibold tracking-tight">Badge Scan</span>
        </Link>
        <nav className="flex items-center gap-2">
          <NavAuthButtons />
        </nav>
      </div>
    </header>
  );
}
