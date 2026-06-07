"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { type Locale, dict, localePath } from "@/lib/i18n";

// Reads auth state on the client so the surrounding page can stay statically
// rendered. Defaults to the logged-out CTA (correct for most marketing
// visitors), then upgrades to "Open dashboard" once we know the user is signed in.
function useLoggedIn() {
  const [loggedIn, setLoggedIn] = useState(false);
  useEffect(() => {
    let active = true;
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      if (active) setLoggedIn(!!data.user);
    });
    return () => {
      active = false;
    };
  }, []);
  return loggedIn;
}

export function NavAuthButtons({ locale = "en" }: { locale?: Locale }) {
  const loggedIn = useLoggedIn();
  const t = dict[locale].nav;

  if (loggedIn) {
    return (
      <Link href="/events" className={buttonVariants()}>
        {t.openDashboard} <ArrowRight className="h-4 w-4" />
      </Link>
    );
  }

  return (
    <>
      <Link href="/login" className={buttonVariants({ variant: "ghost" })}>
        {t.signIn}
      </Link>
      <Link href={localePath(locale, "/demo")} className={buttonVariants()}>
        {t.bookDemo}
      </Link>
    </>
  );
}

export function AuthCtaButton({
  locale = "en",
  loggedOutLabel,
  loggedInLabel,
  variant,
}: {
  locale?: Locale;
  loggedOutLabel?: string;
  loggedInLabel?: string;
  variant?: "secondary";
}) {
  const loggedIn = useLoggedIn();
  const t = dict[locale].nav;
  const outLabel = loggedOutLabel ?? t.bookDemo;
  const inLabel = loggedInLabel ?? t.openDashboard;

  return (
    <Link
      href={loggedIn ? "/events" : localePath(locale, "/demo")}
      className={cn(
        buttonVariants({ size: "lg", variant }),
        variant === "secondary" && "font-semibold",
      )}
    >
      {loggedIn ? inLabel : outLabel} <ArrowRight className="h-4 w-4" />
    </Link>
  );
}
