"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

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

export function NavAuthButtons() {
  const loggedIn = useLoggedIn();

  if (loggedIn) {
    return (
      <Link href="/events" className={buttonVariants()}>
        Open dashboard <ArrowRight className="h-4 w-4" />
      </Link>
    );
  }

  return (
    <>
      <Link href="/login" className={buttonVariants({ variant: "ghost" })}>
        Sign in
      </Link>
      <Link href="/login" className={buttonVariants()}>
        Start free
      </Link>
    </>
  );
}

export function AuthCtaButton({
  loggedOutLabel,
  loggedInLabel = "Open dashboard",
  variant,
}: {
  loggedOutLabel: string;
  loggedInLabel?: string;
  variant?: "secondary";
}) {
  const loggedIn = useLoggedIn();

  return (
    <Link
      href={loggedIn ? "/events" : "/login"}
      className={cn(
        buttonVariants({ size: "lg", variant }),
        variant === "secondary" && "font-semibold",
      )}
    >
      {loggedIn ? loggedInLabel : loggedOutLabel}{" "}
      <ArrowRight className="h-4 w-4" />
    </Link>
  );
}
