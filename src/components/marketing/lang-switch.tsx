"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

// Toggles between the English (root) and Dutch (/nl) version of the current
// marketing page by rewriting the /nl prefix. Only rendered on marketing pages,
// where both locales exist.
export function LangSwitch() {
  const pathname = usePathname() || "/";
  const isNl = pathname === "/nl" || pathname.startsWith("/nl/");

  const enPath = isNl ? pathname.slice(3) || "/" : pathname;
  const nlPath = enPath === "/" ? "/nl" : `/nl${enPath}`;

  return (
    <div className="flex items-center rounded-md border text-xs font-medium">
      <Link
        href={enPath}
        hrefLang="en"
        aria-current={!isNl ? "true" : undefined}
        className={cn(
          "px-2 py-1 rounded-l-md transition-colors",
          !isNl
            ? "bg-foreground text-background"
            : "text-muted-foreground hover:text-foreground",
        )}
      >
        EN
      </Link>
      <Link
        href={nlPath}
        hrefLang="nl"
        aria-current={isNl ? "true" : undefined}
        className={cn(
          "px-2 py-1 rounded-r-md transition-colors",
          isNl
            ? "bg-foreground text-background"
            : "text-muted-foreground hover:text-foreground",
        )}
      >
        NL
      </Link>
    </div>
  );
}
